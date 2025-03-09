import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { categoryRouter } from './routes/category.routes';
import { questionRouter } from './routes/question.routes';
import { Chicken } from "./nest/chicken"; // Health check
import { serveStatic } from 'hono/serve-static';
import { promises as fs } from 'fs';
import path from 'path';

console.log("hello"); // Health check

const chicken = new Chicken(); // Health check
chicken.cluck(); // Health check

const app = new Hono();

// Set up routers
app.route('/categories', categoryRouter);
app.route('/questions', questionRouter);

// Serve static files from the "public" directory
app.use(
    '/*',
    serveStatic({
      root: path.join(__dirname, 'public'),
      getContent: async (filePath, c) => {
        try {
          return await fs.readFile(filePath);
        } catch (err) {
          return null;
        }
      }
    })
);

// Default route for the root URL
app.get('/', (c) => {
  return c.text('Welcome to the API');
});

serve(app);