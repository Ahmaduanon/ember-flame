import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Lab from './lab';
import Landing from './landing';
import './globals.css';
import './studio.css';
function Root(){
 const [hash,setHash]=useState(location.hash),[opened,setOpened]=useState(location.hash.startsWith('#app'));
 const inApp=hash.startsWith('#app');
 useEffect(()=>{const change=()=>{setHash(location.hash);if(location.hash.startsWith('#app')){setOpened(true);window.scrollTo(0,0);}};window.addEventListener('hashchange',change);return()=>window.removeEventListener('hashchange',change);},[]);
 return <>{!inApp&&<Landing/>}{opened&&<div hidden={!inApp}><Lab/></div>}</>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Root/></React.StrictMode>);
