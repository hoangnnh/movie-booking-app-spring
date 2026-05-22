import Footer from "../components/layout/Footer";

export default function FooterPreview() {
  return (
    <div className="min-h-screen bg-app-background p-[48px] text-app-text">
      <div className="mx-auto flex max-w-[1000px] flex-col gap-[32px]">
        <Footer
          variant="image"
          heroImageUrl="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1600&auto=format&fit=crop"
          className="rounded-card"
        />

        <Footer variant="plain" className="rounded-card" />
      </div>
    </div>
  );
}