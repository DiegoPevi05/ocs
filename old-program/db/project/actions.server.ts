// actions.server.ts
import { prisma } from "~/db/db.server"; // Import Prisma client instance
import { requireUser} from "../auth/session.server";
import { assignPermissionsToUser, getCommonPermissionforSupervisorbyProject, requirePermission } from "../permission/actions.server";
import {createProjectConfigs} from "../config/actions.server";

// Create a new project for a user
export async function createProject(request: Request, projectData: ProjectParams):Promise<ProjectParams|null> {

  const user = await requireUser(request);
  await requirePermission(user,'store','Project')

  const project = await prisma.project.create({
    data: {
      external_id:projectData.external_id,
      name:projectData.name,
      description:projectData.description || null,
      created_by:user.username 
    },
  });

  // Fetch all admin users
  const authUsers = await prisma.user.findMany({
    where: { 
      role: { in: ['ADMIN', 'SUPERVISOR'] } 
    },
  });

  // Add all admin users to the project
  authUsers.forEach(async (authUser) => {
    await addUserToProject(request, project.id, authUser.id);
    await assignPermissionsToUser(authUser.id, getCommonPermissionforSupervisorbyProject(project.id))
  });

  // Check if the current user is not an admin, then add them to the project
  const isCurrentUserAuth = authUsers.some((authUser) => authUser.id === user.id);
  if (!isCurrentUserAuth) {
    await addUserToProject(request, project.id, user.id);
    await assignPermissionsToUser(user.id, getCommonPermissionforSupervisorbyProject(project.id))
  }

  await createProjectConfigs(project.id)


  return { ...project };

}


// Update a project by ID for a specific user
export async function updateProject(request: Request, projectId: number, updatedData: ProjectParams):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Project')

  try{

    await prisma.project.updateMany({
      where: {
        id: projectId,
      },
      data: {
        external_id:updatedData.external_id,
        name:updatedData.name,
        description:updatedData.description || null,
      },
    });

    return true;


  }catch(error){

    console.error("Error updating project:", error);
    return false;

  }

}


// Delete a project by ID for a specific user
export async function deleteProject(request: Request, projectId: number):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'destroy','Project')

  try{

    await prisma.project.deleteMany({
      where: {
        id: projectId,
      },
    });

    return true;

  }catch(error){

    console.error("Error deleting project:", error);
    return false;

  }

}

export async function getUserProject(request:Request):Promise<ProjectParams[]| null>{
  const user = await requireUser(request);

  await requirePermission(user,'view','Project')

  // Define filter criteria
  const whereClause: Record<string, any> = {};
  // Filter by the specific userId in the UserProject pivot table
  whereClause.users = {
    some: {
      userId: user.id,
    },
  };

  const projects = await prisma.project.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: {
      createdAt: 'desc', // Orders by `createdAt` in descending order
    },
    include: {
      users: true, // Include related userProjects to ensure filtering by userId
    },
  });

  if(!projects) return null;

  return projects;

}

export async function getProjects(
  request: Request,
  page: number = 1,
  size: number = 5,
  filters: Record<string, string | null> // Accept filters object
): Promise<{ projects: ProjectParams[]; lastPage: number; currentPage: number } | null> {

  const user = await requireUser(request);

  await requirePermission(user,'view','Project')

  // Define filter criteria
  const whereClause: Record<string, any> = {};

  if (filters.external_id) {
    whereClause.external_id = decodeURIComponent(filters.external_id);
  }

  if (filters.name) {
    whereClause.name = decodeURIComponent(filters.name);
  }

  if (filters.userId) {
    // Filter by the specific userId in the UserProject pivot table
    whereClause.users = {
      some: {
        userId: Number(filters.userId),
      },
    };
  }

  // Calculate total count with filtering
  const totalProjects = await prisma.project.count({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    orderBy: {
      createdAt: 'desc', // Orders by `createdAt` in descending order
    },
  });

  if (totalProjects === 0) return null;

  const lastPage = Math.ceil(totalProjects / size);

  if (page < 1) page = 1; // Ensure page is at least 1
  if (size < 1) size = 5; // Default size if invalid

  // Fetch projects with or without filters
  const projects = await prisma.project.findMany({
    where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
    skip: (page - 1) * size,
    take: size,
    orderBy: {
      createdAt: 'desc', // Orders by `createdAt` in descending order
    },
    include: {
      users: true, // Include related userProjects to ensure filtering by userId
    },
  });


  return {
    projects,
    lastPage,
    currentPage: page,
  };
}



// Add a user to a project
export async function addUserToProject(
  request: Request,
  projectId: number,
  userId: number
): Promise<boolean> {
  
  await requireUser(request);

  try {
    // Ensure both the user and project exist
    const projectExists = await prisma.project.findFirst({ where: { id: projectId } });
    const userExists = await prisma.user.findFirst({ where: { id: userId } });

    if(!projectExists || !userExists) {
      return false;
    }

    // Check if the user is already added to the project
    const existingRelation = await prisma.userProject.findFirst({
      where: {
        userId:userId,
        projectId:projectId,
      },
    });

    if (existingRelation) {
      return true; // User is already in the project
    }

    // Add user to project
    await prisma.userProject.create({
      data: {
        userId,
        projectId,
      },
    });

    return true;
  } catch (error) {
    console.error("Error adding user to project:", error);
    return false;
  }
}

// Remove a user from a project
export async function removeUserFromProject(
  request: Request,
  projectId: number,
  userId: number
): Promise<boolean> {

  await requireUser(request);

  try {
    // Ensure the relation exists
    const existingRelation = await prisma.userProject.findUnique({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    if (!existingRelation) {
      return false;
    }

    // Remove user from project
    await prisma.userProject.delete({
      where: {
        userId_projectId: { userId, projectId },
      },
    });

    return true;
  } catch (error) {
    console.error("Error removing user from project:", error);
    return false;
  }
}

export async function getProjectById(projectId: number):Promise<ProjectParams|null>{
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  return project || null;
}
