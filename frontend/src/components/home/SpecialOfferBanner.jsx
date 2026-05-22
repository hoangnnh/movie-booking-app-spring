export default function SpecialOfferBanner() {
  return (
    <section className="ticketor-container">
      <div className="flex items-center justify-center rounded-tk-8 bg-primary-600 px-[24px] py-[12px] text-neutral-900">
        <p className="type-body-s">
          <span className="font-bold">Special Offer:</span> Buy 2 tickets, get 1
          FREE! Valid this weekend only.{" "}
          <button className="font-bold underline">Learn More</button>
        </p>
      </div>
    </section>
  );
}