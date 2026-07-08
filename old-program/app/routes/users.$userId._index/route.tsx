import { useLoaderData, useNavigate } from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import {  useState} from "react";
import {LoaderFunction, redirect} from "@remix-run/node";
import {getCommonPermissionforSupervisorbyProject, getCommonPermissionforUserbyProject, getCommonPermissionSupervisor, getCommonPermissionUser} from "~/db/permission/actions.server";
import { prisma } from "~/db/db.server"; // Import Prisma client instance
import {toast} from "sonner";
import UserForm from "~/components/users/UserForm";
import {getUser} from "~/db/auth/auth.server";
import {useTranslation} from "react-i18next";

// Loader function to enforce authentication
export const loader: LoaderFunction = async ({request,params}) => {

  const userCommonPermissions = getCommonPermissionUser();
  const userProjectPermissions = getCommonPermissionforUserbyProject(0);
  const supervisorCommonPermissions = getCommonPermissionSupervisor();
  const supervisorProjectPermissions = getCommonPermissionforSupervisorbyProject(0);

  const { userId } = params;

  const user = await getUser(request, Number(userId))

  if(user == null ) return redirect("/users"); 

  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: 'desc', // Orders by `createdAt` in descending order
    },
  });

  return Response.json({
    user:user,
    projects:projects,
    userProjectPermissions,
    userCommonPermissions,
    supervisorCommonPermissions,
    supervisorProjectPermissions
  });
};

const UserPage = () => {

  const { user, projects, userCommonPermissions, userProjectPermissions,  supervisorCommonPermissions, supervisorProjectPermissions } = useLoaderData<typeof loader>();

  const {t} = useTranslation();

  const navigate = useNavigate();

  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});

  const {showLoader, hideLoader} = useLoader(); 

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); // Prevent default form submission
    showLoader();
    setErrorMessages({});

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/user?userId=${user.id}`, {
        method: "PUT",
        body: formData, // Sends as multipart/form-data
      });

      const result = await response.json();
      if (response.ok) {
        toast.success(t('user.update.success', { id: result.id }));
	form.reset();
	navigate("/users")
      } else {
	if (result.errorMessages) {
	  setErrorMessages(result.errorMessages); // Store field-specific errors
	}
	toast.error(t("user.update.error",{ id: user.id }));
      }

    } catch (error) {
      console.error(error);
      toast.success(t('user.update.failed', { error: error }));
    } finally {
      hideLoader();
    }
  }


  return(
      <UserForm
	header={"user.update.name"}
	user={user}
	errorMessages={errorMessages}
	projects={projects}
	userCommonPermissions={userCommonPermissions}
	userProjectPermissions={userProjectPermissions}
	supervisorCommonPermissions={supervisorCommonPermissions}
	supervisorProjectPermissions={supervisorProjectPermissions}
	onSubmitForm={handleSubmit}
	btnForm={"user.update.name"}
      />
  );
}

export default UserPage;
