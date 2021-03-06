import { fastify, FastifyRequest, FastifyReply } from "fastify";
import pointOfView from "point-of-view";
import fastifyStatic from 'fastify-static';
import * as path from 'path';
import petitio from "petitio";

declare module "fastify" {
    interface FastifyReply {
        view(page: string, data?: object): FastifyReply;
        sendFile(file: string, data?: object): FastifyReply;
    }
};
const server = fastify();

// plugins
server.register(pointOfView, {
    root: path.join(process.cwd(), 'src/views/pages'),
    viewExt: 'ejs',
    engine: {
        ejs: (await import('ejs')),
    }
});
server.register(fastifyStatic, {
    root: path.join(path.join(process.cwd(), 'build/public'))
});

// types
type parambasic = FastifyRequest<{ Params: { tid: string } }>

// routes
server.get('/style.css', async (request, reply) => { reply.sendFile('compiled.css') });
server.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
    reply.view('home');
});
server.get('/shop/:tid', async (request: parambasic, reply: FastifyReply) => {
    const orders = await petitio(`http://localhost:3069/orders/${request.params?.tid}/`).json();
    reply.view('index', { orders: orders.orderlist });
});

// arc.io
server.get('/arc-sw.js', async (request: FastifyRequest, reply: FastifyReply) => {
    const res = await petitio('https://arc.io/arc-sw.js').text();
    reply.header('Content-Type', 'application/javascript; charset=utf-8').send(res);
});

// start
const start = async () => {
    try {
        await server.listen(5069);
        const address = server.server.address();
        const port = typeof address === 'string' ? address : address?.port;
        console.log(`server live at localhost:${port}`);
    } catch (err) {
        console.error(err);
        server.log.error(err);
        process.exit(1);
    }
};
start();