import AccountSettingsPanel from "@/components/AccountSettingsPanel";
import ThemeToggle from "@/components/ThemeToggle";

export default function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-sm flex-1 px-5 py-10">
      <h1 className="font-display text-3xl tracking-wide text-foreground">Settings</h1>
      <div className="mt-6">
        <ThemeToggle />
      </div>
      <div className="mt-6">
        <AccountSettingsPanel redirectIfLoggedOut={false} />
      </div>
    </div>
  );
}
