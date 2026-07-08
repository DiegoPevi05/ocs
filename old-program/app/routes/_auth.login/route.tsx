// app/routes/login.tsx
import { useEffect, useState } from "react";
import { json, ActionFunction } from "@remix-run/node";
import { Form, useActionData, useNavigate , useNavigation} from "@remix-run/react";
import  {loginSchema} from "~/db/schemas/login";
import { login } from "~/db/auth/auth.server"; // Your login function
import { ZodError } from "zod";
import { useTranslation } from "react-i18next";
import Eye from "~/assets/svg/common/eye.svg?react"
import EyeOff from "~/assets/svg/common/eye-off.svg?react"
import Button from "~/components/Button";
import {toast} from "sonner";
import {createUserSession} from "~/db/auth/session.server";
import {useLoader} from "~/components/loaders/LoaderContext";

type ActionData = {
  errorMessages?: Record<string, string>;
  formError?: string;
};

// Action function to handle form submission
export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const errorMessages: Record<string, string> = {};

  try {
    loginSchema.parse({ email, password });
  } catch (error) {
    if (error instanceof ZodError) {
      error.errors.forEach((err) => {
        const fieldName = err.path[0] as string;
        errorMessages[fieldName] = err.message;
      });
      return Response.json({ errorMessages }, { status: 400 });
    }
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || request.headers.get('x-real-ip') 
    || '0.0.0.0';

    const LoginResponse:any = await login({ email, password, ip });

  if (!LoginResponse) {
    return Response.json({ formError: "auth.signin.validations.invalid_credentials" }, { status: 401 });
  }

  return createUserSession(LoginResponse.token, "/");
};

export default function LogIn() {
  const actionData = useActionData<ActionData>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (actionData?.formError) {
      toast.error(t(actionData.formError));
    }
  }, [actionData?.formError]);

  return (
        <Form
          method="post"
          id="form_user_login"
          className="w-[90%] sm:w-[400px] h-auto flex flex-col justify-center items-center rounded-2xl shadow-2xl p-6"
          style={{ background: "rgba(255,255,255,0.80)" }}
        >
          <div className="w-auto px-12 py-2 bg-primary flex justify-center items-center rounded-md">
            <img onClick={() => navigate("/")} src="/images/logo.png" alt="logo" className="w-auto h-8 cursor-pointer hover:scale-105" />
          </div>
          <p className="text-body text-xl my-2 font-bold">{t("auth.signin.header")}</p>
          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
            <label htmlFor="email" className="text-body h-3 sm:h-6 capitalize">{t("auth.signin.email")}</label>
            <input name="email" className="w-full h-8 sm:h-10 font-tertiary px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("auth.signin.email")} />
            <div className="w-full h-6">
              {actionData?.errorMessages?.email && (
                <p id="error-message-email" className="h-6 text-[10px] sm:text-xs text-secondary-dark animation-element slide-in-up">
                  {t(actionData.errorMessages.email)}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col justify-start items-start w-full h-auto overflow-hidden my-1 gap-y-2 sm:gap-y-1">
            <label htmlFor="password" className="text-body h-3 sm:h-6 capitalize">{t("auth.signin.password")}</label>
            <div className="h-auto w-full relative">
              <input name="password" type={showPassword ? "text" : "password"} className="relative w-full h-8 sm:h-10 px-2 border-b-2 border-secondary focus:outline-none focus:border-b-2 focus:border-b-primary" placeholder={t("auth.signin.password")} />
              <div onClick={() => setShowPassword(!showPassword)} className="absolute top-0 right-2 h-full w-8 flex justify-center items-center cursor-pointer z-50 text-body">
                {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
              </div>
            </div>
            <div className="w-full h-6">
              {actionData?.errorMessages?.password && (
                <p id="error-message-password" className="h-6 text-[10px] sm:text-xs text-secondary-dark animation-element slide-in-up">
                  {t(actionData.errorMessages.password)}
                </p>
              )}
            </div>
          </div>
          <Button isLoading={false} size="lg" className="capitalize">{t("auth.signin.log_in")}</Button>
        </Form>
  );
}
