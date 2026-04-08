import { Archive, ArrowUpRight } from '@phosphor-icons/react';
import type { CSSProperties } from 'react';
import BrutalistButton from '../components/ui/BrutalistButton.tsx';
import DecryptedText from '../components/home/DecryptedText.tsx';
import MovingWordBar from '../components/home/MovingWordBar.tsx';
import HomeSecondSection from './home/HomeSecondSection.tsx';
import HomeThirdSection from './home/HomeThirdSection.tsx';

type HomePageProps = {
  onOpenArchives: () => void;
  onOpenWorkspace: () => void;
};

export default function HomePage({ onOpenArchives, onOpenWorkspace }: HomePageProps) {
  return (
    <div className="w-full snap-y snap-mandatory">
      <section className="h-[calc(100vh-4rem)] snap-start flex flex-col justify-between px-6 py-12 relative overflow-visible">

        <div className="w-full max-w-7xl mx-auto flex flex-col items-center justify-start flex-1 pt-4 md:pt-8 my-4 relative z-10">
          <div className="flex flex-col items-center justify-center gap-2 md:gap-3 font-sans font-black uppercase text-[14vw] md:text-[9vw] leading-[0.9] tracking-tight text-center">
            <h1 className="text-textBlack">
              <span className="hero-word inline-block bg-textBlack text-white px-2 md:px-3" style={{ '--tilt': '-2deg' } as CSSProperties}>Scatter</span>{' '}
              <span className="hero-word inline-block" style={{ '--tilt': '2deg' } as CSSProperties}>Now.</span>
            </h1>
            <h1 className="text-textBlack">
              <span className="hero-word inline-block" style={{ '--tilt': '-1deg' } as CSSProperties}>Think</span>{' '}
              <span className="hero-word inline-block bg-textBlack text-white px-2 md:px-3" style={{ '--tilt': '1.5deg' } as CSSProperties}>Later.</span>
            </h1>
          </div>
          <p className="mt-8 text-xl md:text-3xl font-black tracking-wide uppercase text-textBlack text-center">
            <DecryptedText text="From chaos to clarity" />
          </p>
        </div>

        <div className="w-full flex flex-col items-center gap-6 pt-6 mb-0">
          <div className="flex gap-4">
            <BrutalistButton className="hover:bg-accentElectric" onClick={onOpenArchives}>
              <Archive size={16} weight="bold" /> Open Archives
            </BrutalistButton>
            <BrutalistButton className="hover:bg-accentCoral" onClick={onOpenWorkspace}>
              New Canvas <ArrowUpRight size={16} weight="bold" />
            </BrutalistButton>
          </div>
        </div>

        <MovingWordBar
          className="absolute left-1/2 top-full z-30 w-screen -translate-x-1/2 border-2 border-[#FF7A1A] bg-[#FF7A1A] text-accentElectric"
          words={['INTERACT', 'PLAY', 'WEBSITE', 'THINK', 'BUILD', 'EXPLORE']}
          speedSeconds={18}
        />
      </section>

      <HomeSecondSection />
      <HomeThirdSection />
    </div>
  );
}
