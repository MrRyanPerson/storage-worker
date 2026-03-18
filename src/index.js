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
import cryptoRandomString from 'crypto-random-string';

export default {
	async fetch(req, env) {
		const url = new URL(req.url)
    	const path = url.pathname;

		if (path.startsWith("/files/")) {
			const id = path.split("/")[2];
			const prefix = `uploads/${id}/`

			const result = await env.STORAGE_BUCKET.list({
				prefix,
				delimiter: "/"
			});

			return Response.json({
				files: result.objects.map(o => o.key)
    		},
			{
			headers: {
				"Access-Control-Allow-Origin": "*",
			}});

		}
		
		if (path === "/upload" && req.method === "POST") {
			const formData = await req.formData();
			const files = formData.getAll("files");

			if (!files.length) {
				return new Response("No files uploaded", { status: 400 });
			}

			const uploaded = [];

			const uuid = cryptoRandomString({length: 8, characters: 'ABCDEFGHJKLMNPQRSTUVWXYZ12345679'});

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
			}, {
			headers: {
				"Access-Control-Allow-Origin": "*",
			},
			});
		}
	}
};
