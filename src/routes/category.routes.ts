import { Hono } from 'hono';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import xss from 'xss';

const prisma = new PrismaClient();
export const categoryRouter = new Hono();

const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long")
});

// GET all categories
categoryRouter.get('/', async (c) => {
  try {
    const categories = await prisma.category.findMany();
    return c.json(categories, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// GET a single category
categoryRouter.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  try {
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return c.json({ error: 'Category not found' }, 404);
    return c.json(category, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// GET all questions for a category
categoryRouter.get('/:slug/questions', async (c) => {
  const slug = c.req.param('slug');
  try {
    // Find the category by slug
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) {
      return c.json({ error: 'Category not found' }, 404);
    }

    // Fetch all questions that match this category ID
    const questions = await prisma.question.findMany({
      where: { categoryId: category.id },
      include: { answers: true }
    });

    return c.json(questions, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});


// PATCH update a category
categoryRouter.patch('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const schema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters long").optional(),
    slug: z.string().min(1).optional()
  });
  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) return c.json({ error: 'Not Found' }, 404);
    const body = schema.parse(await c.req.json());
    const sanitizedData = {
      name: body.name ? xss(body.name) : existing.name,
      slug: body.slug ? xss(body.slug) : existing.slug
    };
    const updatedCategory = await prisma.category.update({
      where: { slug },
      data: sanitizedData
    });
    return c.json(updatedCategory, 200);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request' }, 400);
    }
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// DELETE a category
categoryRouter.delete('/:slug', async (c) => {
  const slug = c.req.param('slug');
  try {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) return c.json({ error: 'Not Found' }, 404);
    await prisma.category.delete({ where: { slug } });
    return c.body(null, 204);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Create a new category
categoryRouter.post('/', async (c) => {
  const schema = z.object({ name: z.string().min(2, "Name must be at least 2 characters long") });
  try {
    const body = schema.parse(await c.req.json());
    const name = xss(body.name);
    let slug = name.toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '');
    const category = await prisma.category.create({ data: { name, slug } });
    return c.json(category, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: 'Bad Request' }, 400);
    }
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default categoryRouter;