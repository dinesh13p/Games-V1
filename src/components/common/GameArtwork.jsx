import { stringProp } from '../../utils/propTypes'

const ink = '#303a30', rust = '#a3422a', paper = '#e7e1d5', olive = '#697456'
const rect = (x, y, w, h, fill = ink, key = `${x}-${y}`) => <rect key={key} x={x} y={y} width={w} height={h} fill={fill} />

// Original small game diagrams, not screenshots or a substitute for the live demo.
export default function GameArtwork({ id }) {
    let drawing
    switch (id) {
        case 'baghchal':
            drawing = <g>
                <path d="M30 20H130V120H30ZM55 20V120M80 20V120M105 20V120M30 45H130M30 70H130M30 95H130M30 20L130 120M130 20L30 120M80 20L130 70L80 120L30 70Z" fill="none" stroke={olive} strokeWidth="1.4" />
                {[[30, 20], [130, 20], [30, 120], [130, 120]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="8" fill={rust} />)}
                {[[55, 45], [80, 45], [80, 70], [105, 95], [55, 95]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="7" fill={paper} stroke={ink} strokeWidth="2" />)}
            </g>
            break
        case 'snake':
            drawing = <g><path d="M35 108V42H82V82H125" fill="none" stroke={ink} strokeWidth="18" strokeLinejoin="miter" /><rect x="127" y="31" width="13" height="13" fill={rust} /><path d="M120 78h3m-3 8h3" stroke={paper} strokeWidth="2" /></g>
            break
        case 'tetris':
            drawing = <g>{[[36, 102], [58, 102], [80, 102], [102, 102], [36, 80], [58, 80], [102, 80], [36, 58], [58, 58], [102, 58], [58, 36], [80, 36], [80, 14]].map(([x, y], i) => rect(x, y, 20, 20, i > 9 ? rust : i > 5 ? olive : ink))}</g>
            break
        case 'go':
            drawing = <g><path d="M25 28H135M25 56H135M25 84H135M25 112H135M38 16V124M66 16V124M94 16V124M122 16V124" fill="none" stroke={olive} />{[[38, 28], [66, 56], [94, 84], [122, 112], [66, 28], [94, 56], [66, 84]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="10" fill={i < 4 ? ink : paper} stroke={ink} strokeWidth="1.5" />)}</g>
            break
        case 'pacman':
            drawing = <g><path d="M20 28H62V45H38V105H70M100 28H139V64H114V104H139" fill="none" stroke={olive} strokeWidth="8" /><path d="M93 52A23 23 0 1 0 93 88L73 70Z" fill={rust} />{[109, 124, 139].map(x => <circle key={x} cx={x} cy="78" r="3" fill={ink} />)}</g>
            break
        case 'spaceinvaders':
            drawing = <g>{[0, 1, 2].map(n => <path key={n} d="M0 5h5V0h5v5h10V0h5v5h5v15h-5v5h-5v-5H10v5H5v-5H0ZM7 10v4h4v-4Zm12 0v4h4v-4Z" transform={`translate(${22 + n * 44} 29)`} fill={n === 1 ? rust : ink} fillRule="evenodd" />)}<path d="M65 110V99H75V88H85V99H95V110Z" fill={ink} /><path d="M80 76V67M34 72V82M121 61V73" stroke={rust} strokeWidth="3" /></g>
            break
        case 'tictactoe':
            drawing = <g><path d="M60 20V120M100 20V120M20 50H140M20 90H140" stroke={olive} strokeWidth="2" /><path d="M29 26l19 18m0-18L29 44M110 59l18 22m0-22l-18 22M70 100l19 15m0-15l-19 15" stroke={rust} strokeWidth="4" /><circle cx="80" cy="70" r="12" stroke={ink} strokeWidth="4" fill="none" /><circle cx="120" cy="34" r="10" stroke={ink} strokeWidth="4" fill="none" /></g>
            break
        case 'minesweeper':
            drawing = <g>{Array.from({ length: 12 }, (_, i) => rect(24 + (i % 4) * 29, 28 + Math.floor(i / 4) * 29, 27, 27, [0, 1, 4, 5, 8].includes(i) ? '#c7c9b7' : ink))}<text x="35" y="77" fill={ink} fontFamily="Courier New" fontSize="20">1</text><text x="63" y="48" fill={rust} fontFamily="Courier New" fontSize="20">2</text><path d="M93 72V91M93 72h14l-7 8h-7" fill={paper} stroke={paper} strokeWidth="2" /></g>
            break
        case 'pong':
            drawing = <g><path d="M80 20V120" stroke={olive} strokeWidth="1" strokeDasharray="5 7" />{rect(28, 42, 9, 43)}{rect(123, 77, 9, 43)}<circle cx="98" cy="65" r="6" fill={rust} /><path d="M58 88L83 72" stroke={olive} strokeWidth="2" /></g>
            break
        case 'brickbreaker':
            drawing = <g>{Array.from({ length: 12 }, (_, i) => rect(20 + (i % 4) * 31, 25 + Math.floor(i / 4) * 17, 28, 13, i < 4 ? rust : olive))}{rect(62, 115, 45, 6)}<circle cx="80" cy="94" r="5" fill={ink} /></g>
            break
        case 'flappybird':
            drawing = <g>{rect(114, 0, 23, 45, olive)}{rect(110, 38, 31, 8, ink)}{rect(114, 103, 23, 37, olive)}{rect(110, 98, 31, 8, ink)}<path d="M44 64h29v20H44V64Zm29 8h12v7H73" fill={rust} /><path d="M41 72h17v6H41" fill={ink} />{rect(65, 66, 4, 4, paper)}</g>
            break
        case 'frogger':
            drawing = <g><path d="M18 41H142M18 89H142" stroke={olive} strokeWidth="2" />{rect(22, 23, 50, 8, olive)}{rect(86, 48, 55, 8, olive)}{rect(26, 99, 32, 16)}{rect(107, 70, 32, 16)}<path d="M75 91V68h16V91M68 71h7m16 0h7M68 91h7m16 0h7" stroke={rust} fill={rust} strokeWidth="7" /></g>
            break
        case 'doodlejump':
            drawing = <g>{rect(21, 110, 44, 7, olive)}{rect(90, 80, 49, 7, olive)}{rect(20, 49, 41, 7, olive)}{rect(83, 17, 37, 7, olive)}<path d="M74 72V50h17V72m-17-5h-6m23 0h7" fill={rust} stroke={rust} strokeWidth="3" /><path d="M78 78l-4 14" stroke={ink} strokeWidth="2" /></g>
            break
        case 'ludo':
            drawing = <g><path d="M20 20h42v42H20zM98 20h42v42H98zM20 98h42v22H20zM98 98h42v22H98zM62 52h36v46H62z" fill="none" stroke={olive} strokeWidth="3" /><path d="M20 62h42v36H20M98 62h42v36H98" fill="none" stroke={rust} strokeWidth="3" /><path d="M62 62h36v36H62z" fill={paper} stroke={ink} strokeWidth="2" />{[[35,35], [47,47], [113,35], [125,47], [35,113], [47,101], [113,113], [125,101]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="6" fill={i % 2 ? rust : ink} />)}</g>
            break
        default:
            drawing = <g><circle cx="96" cy="62" r="38" fill="none" stroke={olive} strokeWidth="9" /><circle cx="96" cy="62" r="20" fill="none" stroke={rust} strokeWidth="7" /><circle cx="96" cy="62" r="5" fill={ink} /><path d="M25 116L96 62M25 116v-13M25 116h14" stroke={ink} strokeWidth="3" /><path d="M96 100V127" stroke={olive} strokeWidth="4" /></g>
    }
    return <svg viewBox="0 0 160 140" aria-hidden="true" focusable="false">{drawing}</svg>
}
GameArtwork.propTypes = { id: stringProp }
