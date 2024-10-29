/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

/**
 * Worker en TypeScript para Cloudflare con la API de Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

interface Env {
	GEMINI_API_KEY: string;
}

interface RequestData {
	user_prompt: string;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Solo acepta solicitudes POST
		if (request.method !== 'POST') {
			return new Response('Solo se aceptan solicitudes POST', { status: 405 });
		}

		try {
			// Obtener el cuerpo de la solicitud como JSON
			const requestData: RequestData = await request.json();
			const userInput = requestData.user_prompt;

			// Configurar el cliente de Google Generative AI
			const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

			// Configurar el modelo con instrucciones de sistema
			const systemInstructions =
				'Lee el título de la noticia provista en el enlace y analiza si tiene elementos de clickbait. Para identificar el clickbait, verifica si el título exagera, deja la información incompleta o sugiere misterio innecesario. Si detectas clickbait, responde brevemente a la pregunta implícita en el título. La respuesta debe proporcionar la información clave de la noticia de forma concisa. La noticia puede estar en español o inglés.';
			const model = genAI.getGenerativeModel({
				model: 'gemini-1.5-flash',
				systemInstruction: systemInstructions,
			});

			// Generar contenido usando la entrada del usuario
			const result = await model.generateContent([userInput]);

			// Responder con el contenido generado en formato JSON
			return new Response(JSON.stringify({ response: result.response.text() }), {
				headers: { 'Content-Type': 'application/json' },
			});
		} catch (error) {
			console.error('Error al procesar la solicitud:', error);
			return new Response('Error en la solicitud', { status: 500 });
		}
	},
} satisfies ExportedHandler<Env>;
