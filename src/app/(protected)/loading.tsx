import { LoadingState } from "@/components/states";

export default function Loading() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 sm:py-10">
      <LoadingState />
    </main>
  );
}
