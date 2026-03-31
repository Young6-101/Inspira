import { Archive, ArrowUpRight } from '@phosphor-icons/react';
import BrutalistButton from '../components/ui/BrutalistButton.tsx';
import HomeSecondSection from './home/HomeSecondSection.tsx';
import HomeThirdSection from './home/HomeThirdSection.tsx';

type HomePageProps = {
  onOpenArchives: () => void;
  onOpenWorkspace: () => void;
};

export default function HomePage({ onOpenArchives, onOpenWorkspace }: HomePageProps) {
  return (
    <div className="w-full snap-y snap-mandatory">
      <section className="h-[calc(100vh-4rem)] snap-start flex flex-col justify-between px-6 py-12 relative">
        <div className="flex justify-between items-start w-full">
          <p className="text-sm font-medium w-64 leading-tight border-l-2 border-textBlack pl-4">A brutalist approach to nonlinear ideation. Drop fragments. Find form later.</p>
          <p className="text-xs font-bold uppercase tracking-widest border border-textBlack px-3 py-1 bg-white">V.1.0.4</p>
        </div>

        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center flex-1 my-12 relative z-10">
          <h1 className="text-[15vw] md:text-[12vw] font-display leading-[0.85] tracking-normal text-textBlack text-center w-full">
            SCATTER NOW,
          </h1>
          <h1 className="text-[15vw] md:text-[12vw] font-display leading-[0.85] tracking-normal text-textBlack text-center w-full mt-2">
            THINK <span className="text-accentViolet">LATER.</span>
          </h1>
        </div>

        <div className="w-full flex justify-between items-end border-t-2 border-textBlack pt-6">
          <div className="flex gap-4">
            <BrutalistButton className="hover:bg-accentElectric" onClick={onOpenArchives}>
              <Archive size={16} weight="bold" /> Open Archives
            </BrutalistButton>
            <BrutalistButton className="hover:bg-accentCoral" onClick={onOpenWorkspace}>
              New Canvas <ArrowUpRight size={16} weight="bold" />
            </BrutalistButton>
          </div>
        </div>
      </section>

      <HomeSecondSection />
      <HomeThirdSection />
    </div>
  );
}
