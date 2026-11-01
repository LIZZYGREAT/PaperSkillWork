import './chapter-flourish.css';

/** A botanical ornament, deliberately separate from samples and model signals. */
export default function ChapterFlourish({ end = false }: { end?: boolean }) {
  return <svg className={end ? 'chapter-flourish is-ending' : 'chapter-flourish'} viewBox="0 0 166 38" aria-hidden="true" focusable="false">
    <path className="flourish-ground" d="M1 31C34 23 51 33 78 28S126 25 165 31" />
    <path className="flourish-stem" d="M95 30C104 22 116 18 132 7M112 20L111 9M123 14L139 17" />
    <path className="flourish-leaf" d="M111 13C102 11 101 4 103 1C110 3 114 7 111 13ZM120 16C118 9 122 4 129 3C130 10 127 14 120 16ZM131 17C136 12 143 13 147 18C141 22 136 21 131 17Z" />
    <circle className="flourish-seed" cx="74" cy="20" r="2.2" /><circle className="flourish-seed" cx="83" cy="12" r="1.4" />
  </svg>;
}
