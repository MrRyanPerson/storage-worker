/**
 * Welcome to Cloudflare Workers!
 *
 * This is a template for a Scheduled Worker: a Worker that can run on a
 * configurable interval:
 * https://developers.cloudflare.com/workers/platform/triggers/cron-triggers/
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Run `curl "http://localhost:8787/__scheduled?cron=*+*+*+*+*"` to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import {v4 as uuidv4} from 'uuid';

export default {
	async fetch(req, env) {
		const url = new URL(req.url)
    	const path = url.pathname;

		if (path.startsWith("/files/")) {
			const prefix = "uploads/" + path.split("/")[2]; + "/"

			const result = await env.STORAGE_BUCKET.list({
				prefix,
				delimiter: "/"
			});

			return Response.json({
				folders: result.delimitedPrefixes,
				files: result.objects.map(o => o.key)
    		});

		}
		
		if (path === "/upload" && request.method === "POST") {
			const formData = await req.formData();
			const files = formData.getAll("files");

			if (!files.length) {
				return new Response("No files uploaded", { status: 400 });
			}

			const uploaded = [];

			const uuid = uuidv4();

			for (const file of files) {
				if (!(file instanceof File)) continue;

				const key = `uploads/${uuid}/${file.name}`;

				await env.STORAGE_BUCKET.put(key, file.stream(), {
					httpMetadata: {
						contentType: file.type
					}
				});

				uploaded.push(key);
			}

			return Response.json({
				success: true,
				files: uploaded,
				key: uuid
			});
		}
	}
};
