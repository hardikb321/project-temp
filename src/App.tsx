import { MyMap } from "./components/MyMap";


import { Toolbar } from "./components/Toolbar";

export default function Page() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Toolbar />
      <main className="flex-1 p-6">
        <MyMap />
      </main>
    </div>
  );
}

