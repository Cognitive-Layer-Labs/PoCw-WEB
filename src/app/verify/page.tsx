import { VerifyFlow } from "@/components/VerifyFlow";

export const metadata = {
  title: "Verify Knowledge — PoCW",
  description: "Adaptive knowledge verification with on-chain attestation.",
};

export default function VerifyPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold mb-2">Knowledge Verification</h1>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Connect your wallet, upload a document, and prove your comprehension through adaptive testing.
        </p>
      </div>
      <VerifyFlow />
    </div>
  );
}
