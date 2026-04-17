import bcrypt from "bcryptjs";
import { prisma } from "../../config/prisma.js";

const questions = [
  {
    topic: "arrays",
    difficulty: "easy" as const,
    language: "en" as const,
    questionText: "Explain how you would find the second largest element in an array and mention the time complexity.",
    followUpQuestions: ["How would duplicates affect your approach?", "Can you solve it in one pass?"]
  },
  {
    topic: "linked-lists",
    difficulty: "medium" as const,
    language: "en" as const,
    questionText: "How would you detect a cycle in a linked list, and why does the two-pointer method work?",
    followUpQuestions: ["How would you find the start of the cycle?", "What is the space complexity?"]
  },
  {
    topic: "operating-systems",
    difficulty: "medium" as const,
    language: "en" as const,
    questionText: "Explain the difference between a process and a thread with one practical example.",
    followUpQuestions: ["What resources do threads share?", "When can multithreading hurt performance?"]
  },
  {
    topic: "databases",
    difficulty: "hard" as const,
    language: "en" as const,
    questionText: "What problem does database indexing solve, and what are the write-time tradeoffs of adding indexes?",
    followUpQuestions: ["When can an index be ignored?", "How would you choose columns for a composite index?"]
  },
  {
    topic: "arrays",
    difficulty: "easy" as const,
    language: "hinglish" as const,
    questionText: "Array mein second largest element kaise find karoge, aur time complexity kya hogi?",
    followUpQuestions: ["Duplicates handle kaise karoge?", "One pass mein solve ho sakta hai?"]
  },
  {
    topic: "os",
    difficulty: "medium" as const,
    language: "hinglish" as const,
    questionText: "Process aur thread mein difference explain karo with ek practical example.",
    followUpQuestions: ["Threads kya share karte hain?", "Multithreading kab performance reduce kar sakti hai?"]
  }
];

async function main() {
  const passwordHash = await bcrypt.hash("Admin@12345", 12);
  await prisma.user.upsert({
    where: { email: "admin@prepos.local" },
    update: {},
    create: {
      name: "PrepOS Admin",
      email: "admin@prepos.local",
      passwordHash,
      languagePreference: "en",
      role: "admin",
      status: "active"
    }
  });

  for (const question of questions) {
    const existing = await prisma.sessionQuestionBank.findFirst({
      where: {
        topic: question.topic,
        difficulty: question.difficulty,
        language: question.language,
        questionText: question.questionText
      }
    });
    if (!existing) {
      await prisma.sessionQuestionBank.create({ data: question });
    }
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
