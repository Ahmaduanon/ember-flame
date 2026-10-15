'use client';
import { useEffect, useRef } from 'react';
import { clamp, type Settings, type SimState } from '@/lib/model';
export type Layer = 'flame' | 'temperature' | 'oxygen' | 'fuel';
export default function FlameView({state,settings,layer,flow}:{state:SimState;settings:Settings;layer:Layer;flow:boolean}) {
  const canvas=useRef<HTMLCanvasElement>(null);
  const latest=useRef({state,settings,layer,flow});latest.current={state,settings,layer,flow};
  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const ctx=el.getContext('2d');if(!ctx)return;
    const field=document.createElement('canvas');field.width=200;field.height=170;
    const fx=field.getContext('2d');if(!fx)return;
    let frame=0,last=0;
    const draw=(now:number)=>{
      frame=requestAnimationFrame(draw); if(now-last<45)return;last=now;
      const {state:s,settings:p,layer:l,flow:showFlow}=latest.current;
      const w=el.clientWidth,h=el.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
      if(!w||!h)return;
      if(el.width!==Math.round(w*dpr)||el.height!==Math.round(h*dpr)){el.width=Math.round(w*dpr);el.height=Math.round(h*dpr);}
      ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      const buoy=clamp(Math.sqrt(p.gravity),0,1.4), b=buoy/(buoy+0.18);
      const cx=w*.5,cy=h*(.46+.065*b);
      ctx.strokeStyle='rgba(130,165,183,.14)';ctx.lineWidth=1;
      ctx.setLineDash([3,7]);ctx.beginPath();ctx.moveTo(cx,48);ctx.lineTo(cx,h-38);ctx.stroke();ctx.setLineDash([]);
      ctx.beginPath();ctx.ellipse(cx,h*.82,w*.23,h*.065,0,0,Math.PI*2);ctx.stroke();
      ctx.beginPath();ctx.ellipse(cx,h*.82,w*.13,h*.035,0,0,Math.PI*2);ctx.stroke();
      const power=s.burning?clamp(s.rate/.65,.06,1.5):0;
      const radius=Math.min(w*.2,h*.27)*(0.85+0.15*Math.sqrt(Math.max(.2,p.flow/.85)));
      const glow=ctx.createRadialGradient(cx,cy,0,cx,cy,radius*2.2);
      glow.addColorStop(0,b<.2?'rgba(33,117,248,.11)':'rgba(246,104,30,.09)');glow.addColorStop(1,'transparent');
      if(s.burning){ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);}
      const img=fx.createImageData(200,170);
      const effective=clamp((s.temperature-p.ambient-273.15)/1500,0,1.5);
      for(let y=0;y<170;y++)for(let x=0;x<200;x++){
        const px=x/200*w,py=y/170*h;
        const yn=(py-cy)/(radius*(1+.5*b));
        const wave=Math.sin(yn*7+s.time*6)*.025*b;
        const taper=clamp(1+b*.55*yn,.24,1.4);
        const xn=(px-cx-radius*wave)/(radius*(1-.39*b)*taper);
        const r=Math.sqrt(xn*xn+yn*yn);
        const rim=Math.exp(-Math.pow((r-.78)/(.10+.025*b),2));
        const core=Math.exp(-r*r*4);
        const heat=(rim*.9+core*.1)*effective;
        let red=0,green=0,blue=0,alpha=0;
        if(l==='flame'){
          const v=clamp(heat,0,1),orange=clamp(b*1.35,0,1);
          red=65*(1-orange)+255*orange;green=135+v*105;blue=255*(1-orange)+(25+v*45)*orange;
          alpha=clamp((rim*.9+core*.18)*Math.min(power,1.1)*effective,0,.97)*255;
        }else{
          const v=l==='temperature'?clamp(heat,0,1):l==='fuel'?clamp((1-r)*1.7,0,1)*clamp(s.fuelMass/.3,.1,1):clamp((r-.35)/1.1,0,1)*(p.oxygen/30);
          if(l==='temperature'){red=clamp(v*3,0,1)*255;green=clamp((v-.3)*2,0,1)*255;blue=100*(1-v);}
          if(l==='oxygen'){red=30+v*25;green=80+v*160;blue=120+v*100;}
          if(l==='fuel'){red=85+v*130;green=50+v*100;blue=155+v*95;}
          alpha=(l==='oxygen'?.36:v*.8)*255;
          if(l==='temperature'&&!s.burning)alpha*=clamp((s.temperature-p.ambient-273.15)/1000,0,1);
        }
        if(l==='flame'&&!s.burning)alpha=0;
        const i=(y*200+x)*4;img.data[i]=red;img.data[i+1]=green;img.data[i+2]=blue;img.data[i+3]=alpha;
      }
      fx.putImageData(img,0,0);ctx.imageSmoothingEnabled=true;ctx.drawImage(field,0,0,w,h);
      // Schematic source: a small porous spherical burner keeps the zero-g case symmetric.
      ctx.beginPath();ctx.arc(cx,cy+radius*.57*b,5,0,Math.PI*2);ctx.fillStyle='#5b626a';ctx.fill();ctx.strokeStyle='#9ba4ad';ctx.stroke();
      if(showFlow){
        ctx.strokeStyle='rgba(128,193,203,.3)';ctx.fillStyle='rgba(128,193,203,.45)';
        for(let i=0;i<18;i++){
          const a=i*Math.PI*2/18,phase=(s.time*.09+i*.19)%1;
          const dr=radius*(2.1-phase*.9);
          let xx=cx+Math.cos(a)*dr, yy=cy+Math.sin(a)*dr;
          const vx=-Math.cos(a)*9*(1-b)+Math.cos(a)*2*b,vy=-Math.sin(a)*9*(1-b)-10*b;
          if(b>.5){xx=cx+(i%6-2.5)*radius*.43;yy=h*.8-phase*h*.68;}
          ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx+vx,yy+vy);ctx.stroke();
          ctx.beginPath();ctx.arc(xx+vx,yy+vy,1.3,0,Math.PI*2);ctx.fill();
        }
      }
      ctx.font='10px ui-monospace, monospace';ctx.fillStyle='#647986';
      ctx.fillText('Y',24,65);ctx.fillText('X',60,h-35);ctx.strokeStyle='#3b4b56';
      ctx.beginPath();ctx.moveTo(28,h-40);ctx.lineTo(28,h-70);ctx.moveTo(28,h-40);ctx.lineTo(55,h-40);ctx.stroke();
      ctx.textAlign='center';ctx.fillStyle='#7f909d';ctx.fillText(s.burning?'POROUS FUEL SOURCE':'FLAME EXTINGUISHED',cx,h-17);ctx.textAlign='left';
    }; frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[]);
  return <canvas ref={canvas} className="flame-canvas" role="img" aria-label={`${layer} schematic at ${settings.gravity} Earth gravity; ${state.status}. Spatial fields are illustrative, not CFD.`}/>;
}
