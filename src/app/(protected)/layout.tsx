import { MainNav } from "./main-nav";

// 認証の確認は、layout ではなく各ページで行う(layout は画面遷移で再実行されないため)
export default function ProtectedLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-zinc-200">
        <MainNav />
      </header>
      {children}
    </>
  );
}
