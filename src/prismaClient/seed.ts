import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// A helper to create a slug from a category name.
function slugify(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '-');
}

// Validate that an object is a valid answer.
function isValidAnswer(obj: any): obj is { answer: string; correct: boolean } {
  return (
    obj &&
    typeof obj.answer === 'string' &&
    typeof obj.correct === 'boolean'
  );
}

// Process and validate a single question.
function processQuestion(q: any) {
  if (typeof q.question !== 'string') {
    return null;
  }
  if (!Array.isArray(q.answers)) {
    return null;
  }
  const validAnswers = q.answers.filter(isValidAnswer);
  if (validAnswers.length === 0) {
    return null;
  }
  return {
    title: q.question,
    answers: {
      create: validAnswers.map((a: { answer: string; correct: boolean }) => ({
        answer: a.answer,
        correct: a.correct,
      })),
    },
  };
}

async function main() {
  const indexPath = path.join(__dirname, '../../data/index.json');
  let indexData;
  try {
    indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
  } catch (error) {
    console.error('Failed to read index.json:', error);
    return;
  }

  for (const entry of indexData) {
    if (!entry.title || !entry.file) {
      console.warn(`Skipping invalid index entry: ${JSON.stringify(entry)}`);
      continue;
    }

    const filePath = path.join(__dirname, '../../data', entry.file);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}`);
      continue;
    }

    let fileContent;
    try {
      fileContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (error) {
      console.error(`Error reading file ${entry.file}:`, error);
      continue;
    }

    if (!fileContent.questions || !Array.isArray(fileContent.questions)) {
      console.warn(`Skipping file with invalid content: ${entry.file}`);
      continue;
    }

    const questionsData = fileContent.questions
      .map(processQuestion)
      .filter((q: { title: string; answers: { create: { answer: string; correct: boolean }[] } }) => q !== null);

    if (questionsData.length === 0) {
      console.warn(`No valid questions found in file: ${entry.file}`);
      continue;
    }

    try {
      await prisma.category.create({
        data: {
          name: entry.title,
          slug: slugify(entry.title),
          questions: {
            create: questionsData,
          },
        },
      });
      console.log(`Seeded category from file: ${entry.file}`);
    } catch (error) {
      console.error(`Error seeding data from file ${entry.file}:`, error);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });