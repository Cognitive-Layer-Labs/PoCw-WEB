import { MockQuestion } from "./mock-grader";

export const MOCK_QUESTIONS: MockQuestion[] = [
  {
    id: "q1",
    type: "mcq",
    text: "Based on your document, what is the primary purpose of the main concept introduced?",
    bloomLevel: "Remember",
    difficulty: -1.5,
    options: [
      "To provide a centralized record-keeping system",
      "To establish verifiable proof of knowledge comprehension",
      "To replace existing certification authorities",
      "To enable anonymous credential issuance",
    ],
    correctIndex: 1,
    keywords: ["proof", "knowledge", "verify", "comprehension", "credential"],
  },
  {
    id: "q2",
    type: "open",
    text: "Explain the key mechanism described in your document and how it achieves its stated goal.",
    bloomLevel: "Understand",
    difficulty: -0.5,
    keywords: ["mechanism", "process", "achieve", "goal", "method", "system", "how"],
  },
  {
    id: "q3",
    type: "true_false",
    text: "The approach described in your document relies on a fully decentralized system with no trusted intermediary.",
    bloomLevel: "Analyze",
    difficulty: 0.5,
    correctAnswer: false,
    keywords: ["decentralized", "trusted", "intermediary", "oracle", "centralized"],
  },
  {
    id: "q4",
    type: "open",
    text: "What are the main trade-offs or limitations of the approach described? How could they be addressed?",
    bloomLevel: "Evaluate",
    difficulty: 1.5,
    keywords: ["trade-off", "limitation", "problem", "issue", "address", "improve", "solution"],
  },
  {
    id: "q5",
    type: "mcq",
    text: "Which of the following best describes the relationship between the assessment score and the on-chain credential?",
    bloomLevel: "Apply",
    difficulty: 0.0,
    options: [
      "The score is stored directly on-chain for transparency",
      "An oracle signs the score and the signature is verified on-chain",
      "The smart contract independently computes the score",
      "The score is hashed and stored in IPFS only",
    ],
    correctIndex: 1,
    keywords: ["oracle", "sign", "signature", "verify", "smart contract", "on-chain"],
  },
];
