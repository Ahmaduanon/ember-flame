export default function Architecture(){
  return <svg className="architecture-art" viewBox="0 0 940 760" fill="none" aria-hidden="true">
    <defs><linearGradient id="sky" x1="420" y1="0" x2="500" y2="760" gradientUnits="userSpaceOnUse"><stop stopColor="#071a38"/><stop offset=".64" stopColor="#1c5182"/><stop offset="1" stopColor="#091a35"/></linearGradient><linearGradient id="glass" x1="500" y1="180" x2="800" y2="680" gradientUnits="userSpaceOnUse"><stop stopColor="#1d4271"/><stop offset=".48" stopColor="#8bb5d0"/><stop offset=".7" stopColor="#315e88"/><stop offset="1" stopColor="#0b274a"/></linearGradient><linearGradient id="side" x1="720" y1="340" x2="900" y2="440" gradientUnits="userSpaceOnUse"><stop stopColor="#214d78"/><stop offset="1" stopColor="#091c39"/></linearGradient><linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#61b8f9" stopOpacity="0"/><stop offset="1" stopColor="#4ba8e9" stopOpacity=".2"/></linearGradient><pattern id="windows" width="18" height="22" patternUnits="userSpaceOnUse"><path d="M0 0H18V22" stroke="#b4dcf3" strokeOpacity=".2"/><path d="M4 5H13V15H4Z" fill="#c1dff0" fillOpacity=".1"/></pattern></defs>
    <path fill="url(#sky)" d="M0 0h940v760H0z"/>
    <circle cx="690" cy="380" r="280" stroke="#a8c8e9" strokeOpacity=".08"/><circle cx="690" cy="380" r="210" stroke="#a8c8e9" strokeOpacity=".07"/>
    <path d="M0 628H940M0 660H940M460 760L690 560M730 760L690 560M940 720L690 560" stroke="#77b7e3" strokeOpacity=".14"/>
    {Array.from({length:19},(_,i)=><g key={i}><path d={`M${i*55} ${600-(i%4)*28}h38V690h-38Z`} fill={i%2?'#14345a':'#0d284a'}/><path d={`M${i*55+8} ${612-(i%4)*28}v52m12-52v52m12-52v52`} stroke="#4e80aa" strokeOpacity=".3"/></g>)}
    <path d="M420 398L548 350V676L420 694Z" fill="#1d426a"/><path d="M548 350L598 387V654L548 676Z" fill="#102c50"/><path d="M420 398L548 350V676L420 694Z" fill="url(#windows)"/>
    <path d="M594 209L741 144V678L594 724Z" fill="url(#glass)"/><path d="M741 144L836 205V645L741 678Z" fill="url(#side)"/><path d="M594 209L741 144L836 205L691 262Z" fill="#315782"/>
    <path d="M608 194L730 143V104L608 156Z" fill="#19375d"/><path d="M730 104L801 150V183L730 143Z" fill="#0e294c"/>
    <path d="M663 131V62M760 125V85" stroke="#80afcf" strokeOpacity=".35"/>
    {Array.from({length:29},(_,i)=>{const t=i/29;return <g key={i}><path d={`M594 ${209+t*515}L741 ${144+t*534}L836 ${205+t*440}`} stroke="#c9e7f6" strokeOpacity={i%3===0?.5:.2}/><path d={`M${594+t*147} ${209-t*65}L${594+t*147} ${724-t*46}`} stroke="#082346" strokeOpacity=".32"/></g>})}
    <path d="M741 144V678" stroke="#c2ebff" strokeOpacity=".7" strokeWidth="2"/>
    <path d="M787 396L906 336V707L787 746Z" fill="url(#glass)"/><path d="M906 336L940 357V689L906 707Z" fill="#112c4e"/>
    {Array.from({length:20},(_,i)=><path key={i} d={`M787 ${396+i*17.5}L906 ${336+i*18.5}`} stroke="#c4e7fc" strokeOpacity=".34"/>)}
    <path d="M812 383V738M844 368V727M876 351V716" stroke="#143e68" strokeWidth="3"/>
    <path d="M0 600H940V760H0Z" fill="url(#haze)"/>
    <path d="M560 470H680M680 470V416M775 555H888M888 555V513" stroke="#7dd8ff" strokeOpacity=".7" strokeDasharray="4 5"/>
    {[{x:680,y:416},{x:888,y:513},{x:485,y:552}].map((p,i)=><g key={i}><circle {...{cx:p.x,cy:p.y}} r="12" fill="#72ccff" fillOpacity=".1" stroke="#72ccff" strokeOpacity=".5"/><circle cx={p.x} cy={p.y} r="3" fill="#b2e7ff"/></g>)}
  </svg>;
}
