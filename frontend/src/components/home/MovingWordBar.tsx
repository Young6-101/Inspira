type MovingWordBarProps = {
  words?: string[];
  speedSeconds?: number;
  className?: string;
};

const defaultWords = ['INTERACT', 'PLAY', 'WEBSITE', 'CREATE', 'EXPLORE', 'REMIX'];

export default function MovingWordBar({
  words = defaultWords,
  speedSeconds = 20,
  className = '',
}: MovingWordBarProps) {
  const content = words.join(' ✦ ');

  return (
    <div className={`w-full overflow-hidden border border-textBlack bg-textBlack text-white ${className}`}>
      <div className="moving-wordbar-track" style={{ animationDuration: `${speedSeconds}s` }}>
        <span>{content}</span>
        <span aria-hidden="true">{content}</span>
      </div>
    </div>
  );
}
