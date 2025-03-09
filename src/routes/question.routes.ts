import { PrismaClient } from '@prisma/client';
import { Hono } from 'hono';
import { z } from 'zod';
import xss from 'xss';

const prisma = new PrismaClient();
export const questionRouter = new Hono();

// Schema for creating a question
const createQuestionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  categoryId: z.number().int().positive("Category ID must be a positive integer"),
  answers: z.array(
    z.object({
      answer: z.string().min(1, "Answer cannot be empty"),
      correct: z.boolean()
    })
  ).min(2, "At least 2 answers required").max(6, "No more than 6 answers allowed")
});

// Schema for updating a question
const questionUpdateSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long").optional(),
  categoryId: z.number().int().positive("Category ID must be a positive integer").optional(),
  answers: z.array(
    z.object({
      answer: z.string().min(1, "Answer cannot be empty"),
      correct: z.boolean()
    })
  ).min(2, "At least 2 answers required").max(6, "No more than 6 answers allowed").optional()
});

// Create a new question
questionRouter.post('/', async (c) => {
  const body = createQuestionSchema.parse(await c.req.json());
  const question = await prisma.question.create({
    data: {
      title: xss(body.title),
      categoryId: body.categoryId,
      answers: {
        create: body.answers.map(ans => ({
          answer: ans.answer,
          correct: ans.correct
        }))
      }
    },
    include: { answers: true }
  });
  return c.json(question, 201);
});

// Get all questions
questionRouter.get('/', async (c) => {
  try {
    const questions = await prisma.question.findMany({
      include: { answers: true }
    });
    return c.json(questions, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Get a single question
questionRouter.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  try {
    const question = await prisma.question.findUnique({
      where: { id },
      include: { answers: true }
    });
    if (!question) return c.json({ error: 'Question not found' }, 404);
    return c.json(question, 200);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

// Update an existing question
questionRouter.patch('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  const body = questionUpdateSchema.parse(await c.req.json());
  const updatedData: any = {};
  if (body.title) updatedData.title = xss(body.title);
  if (body.categoryId) updatedData.categoryId = body.categoryId;

  await prisma.question.update({
    where: { id },
    data: updatedData
  });

  if (body.answers) {
    await prisma.answer.deleteMany({ where: { questionId: id } });
    await prisma.answer.createMany({
      data: body.answers.map(a => ({
        answer: xss(a.answer),
        correct: a.correct,
        questionId: id
      }))
    });
  }

  const updatedQuestion = await prisma.question.findUnique({
    where: { id },
    include: { answers: true }
  });
  return c.json(updatedQuestion, 200);
});

// Delete an existing question
questionRouter.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));
  try {
    const existing = await prisma.question.findUnique({ where: { id } });
    if (!existing) return c.json({ error: 'Question not found' }, 404);
    await prisma.question.delete({ where: { id } });
    return c.body(null, 204);
  } catch (error) {
    console.error(error);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default questionRouter;