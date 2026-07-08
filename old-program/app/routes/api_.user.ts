import {ActionFunction, unstable_parseMultipartFormData} from "@remix-run/node";
import {ZodError} from "zod";
import {createUser, deleteUser, updateUser} from "~/db/auth/auth.server";
import {createUserSchema, updateUserSchema} from "~/db/schemas/login";
import { prisma } from "~/db/db.server";
import {unstable_composeUploadHandlers, unstable_createFileUploadHandler,unstable_createMemoryUploadHandler} from "@remix-run/node";
import { fileURLToPath } from 'url';
import { randomUUID } from "crypto";
import { join, dirname } from 'path';

// Action function to handle form submission
export const action: ActionFunction = async ({ request }) => {

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const storageDir = process.env.NODE_ENV === "production" ? join(__dirname,"..","..", 'storage','users') : join(__dirname,"..", 'storage','users');

  const  uploadHandler =  unstable_composeUploadHandlers(
      unstable_createFileUploadHandler({
	  // where to save the file
	  directory: storageDir,

	  avoidFileConflicts: false,
	  // use the incoming filename instead of creating a new name
	  file: ({ filename }) => {
	      const ext = filename.split('.').pop(); // Get file extension
	      return `${randomUUID()}.${ext}`; // Unique filename
	  },
	  // Limit the max size to 10MB
	  maxPartSize: 2 * 1024 * 1024,
      }),
      unstable_createMemoryUploadHandler()
  ); 

  switch (request.method) {
    case "POST": {

      const formData = await unstable_parseMultipartFormData(request, uploadHandler);

      // Extract the uploaded file
      const file = formData.get("file") as File | null;
      let imageUrl = null;

      if (file && file.name) {
	  imageUrl = `/storage/users/${file.name}`;
      }
      // Extract permissions
      const permissions: UserPermission[] = [];

      for (let i = 0; formData.has(`permissions[${i}]`); i++) {
	  const permString = formData.get(`permissions[${i}]`) as string;
	  if (permString) {
	      try {
		  permissions.push(JSON.parse(permString));
	      } catch (error) {
		  return Response.json({ errorMessages: { permissions: "user.fields.validations.permissions_processing_error" } }, { status: 400 });
	      }
	  }
      }

      const errorMessages: Record<string, string> = {};

      try {
	const userData = createUserSchema.parse({
	  email:formData.get("email"),
	  username:formData.get("username"),
	  password:formData.get("password"),
	  role:formData.get("role"),
	  permissions: permissions
	})

	const userExistant = await prisma.user.findUnique({
	  where:{ email: userData.email }
	})

	if(userExistant){

	  return Response.json({ errorMessages: { email: "user.fields.validations.email_existant" } }, { status: 400 });
	}

	const newUser = await createUser(request, {
	    email: userData.email,
	    username: userData.username,
	    password: userData.password,
	    role: userData.role,
	    permissions: userData.permissions,
	    imageUrl:imageUrl,
	});

	return Response.json(newUser, { status: 201 });


      } catch (error) {
	if (error instanceof ZodError) {
	  error.errors.forEach((err) => {
	    const fieldName = err.path[0] as string;
	    errorMessages[fieldName] = err.message;
	  });
	  return Response.json({ errorMessages }, { status: 400 });
	}
      }

    }

    case "PUT": {

      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");

      const formData = await unstable_parseMultipartFormData(request, uploadHandler);

      // Extract the uploaded file
      const file = formData.get("file") as File | null;
      let imageUrl = null;

      if (file && file.name) {
	  		imageUrl = `/storage/users/${file.name}`;
      }
      // Extract permissions
      const permissions: UserPermission[] = [];

      for (let i = 0; formData.has(`permissions[${i}]`); i++) {
	  const permString = formData.get(`permissions[${i}]`) as string;
	  if (permString) {
	      try {
		  permissions.push(JSON.parse(permString));
	      } catch (error) {
		  return Response.json({ errorMessages: { permissions: "user.fields.validations.permissions_processing_error" } }, { status: 400 });
	      }
	  }
      }

      const errorMessages: Record<string, string> = {};

      try {
	const userData = updateUserSchema.parse({
	  email:formData.get("email") || undefined,
	  username:formData.get("username") || undefined,
	  password:formData.get("password") || undefined,
	  role:formData.get("role"),
	  permissions: permissions
	})

	const updatedUser = await updateUser(request,Number(userId), {
	    email: userData.email,
	    username: userData.username,
	    password: userData.password,
	    role: userData.role,
	    permissions: userData.permissions,
	    imageUrl:imageUrl,
	});

	return Response.json(updatedUser, { status: 200 });


      } catch (error) {
	if (error instanceof ZodError) {
	  error.errors.forEach((err) => {
	    const fieldName = err.path[0] as string;
	    errorMessages[fieldName] = err.message;
	  });
	  return Response.json({ errorMessages }, { status: 400 });
	}
      }

    }

    case "DELETE": {

      const url = new URL(request.url);
      const userId = url.searchParams.get("userId");

      if (!userId) {
	return Response.json({ error: "Missing userId" }, { status: 400 });
      }

      const deletedUser = await deleteUser(request, Number(userId));

      return Response.json(deletedUser, { status: 200 });

    }

  }







};
