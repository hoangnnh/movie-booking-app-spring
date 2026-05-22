import BookingProgress from "../components/booking/BookingProgress";
import MovieDetailsPreview from "../components/movie/MovieDetailsPreview";

export default function ProgressAndDetailsPreview() {
  return (
    <div className="min-h-screen bg-app-background text-app-text">
      <div className="ticketor-container py-[80px]">
        <h1 className="type-h4 mb-[40px]">Booking Progress</h1>

        <div className="mb-[96px]">
          <BookingProgress currentStep={0} />
        </div>

        <div className="mb-[96px]">
          <BookingProgress currentStep={1} />
        </div>

        <div className="mb-[96px]">
          <BookingProgress currentStep={2} />
        </div>
      </div>

      <MovieDetailsPreview />
    </div>
  );
}