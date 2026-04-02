import heroBanner from '@/assets/desktop-hero-banner.jpg';

const DesktopHeroBanner = () => {
  return (
    <div className="relative w-full overflow-hidden h-[100px]">
      <img
        src={heroBanner}
        alt="Vacatio banner"
        className="w-full h-full object-cover object-center"
        width={1920}
        height={512}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
    </div>
  );
};

export default DesktopHeroBanner;
