import { redirect } from "next/navigation";
import { DEFAULT_REDIRECT_PATH } from "@/lib/auth/redirect";

export default function Home() {
  redirect(DEFAULT_REDIRECT_PATH);
}
