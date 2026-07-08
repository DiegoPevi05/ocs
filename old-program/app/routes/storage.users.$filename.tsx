import { LoaderFunction } from "@remix-run/node";
import { createReadStream } from "fs";
import { resolve } from "path";
import { stat } from "fs/promises";
import stream from "stream";
import {requireUser} from "~/db/auth/session.server";

export const loader: LoaderFunction = async ({ request, params }) => {

    await requireUser(request);

    const { filename } = params;
    if (!filename) {
        return new Response("Bad Request", { status: 400 });
    }

    const safeBasePath = resolve(process.env.NODE_ENV === "production" ?  "storage/users" : "app/storage/users" );
    const requestedFile = resolve(safeBasePath, filename);

    // Prevent directory traversal attacks
    if (!requestedFile.startsWith(safeBasePath)) {
        return new Response("Forbidden", { status: 403 });
    }

    try {
        await stat(requestedFile); // Ensure the file exists

        const fileStream = createReadStream(requestedFile);
        const webStream = stream.Readable.toWeb(fileStream);

        return new Response(webStream as any, {
            headers: {
                "Content-Type": "image/jpeg", // Adjust dynamically if needed
                "Cache-Control": "public, max-age=31536000, immutable",
            },
        });
    } catch (error) {
        return new Response("File not found", { status: 404 });
    }
};
