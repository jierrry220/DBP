// LI.FI SDK Bridge with Real Icons
const s=document.createElement('script');s.type='module';s.textContent=`import{LiFi}from'https://esm.sh/@lifi/sdk@2?bundle';window.lifiSdk=new LiFi({integrator:'DebearParty'});window.dispatchEvent(new Event('lifiReady'))`;document.head.appendChild(s);

class LiFiBridge{
constructor(){this.sdk=null;this.web3=null;this.account=null;this.chains=[];this.tokens={};this.from={chain:null,token:null};this.to={chain:null,token:null};this.route=null;this.timer=null}

async init(){
const c=document.getElementById('lifi-widget-container');if(!c)return;
await new Promise(r=>window.lifiSdk?r():window.addEventListener('lifiReady',r,{once:1}));
this.sdk=window.lifiSdk;await this.loadChains();this.renderUI(c);this.checkWallet();
await this.setDefaults();
console.log('✓ Bridge ready')}

async loadChains(){
try{const d=await(await fetch('https://li.quest/v1/chains')).json();
const allowedChains=[1,42161,8453,137,56,43114,80094];
this.chains=(d.chains||d||[]).filter(c=>c.id&&c.name&&allowedChains.includes(c.id));
console.log(`✅ ${this.chains.length} chains loaded`)}catch(e){console.error(e)}}

checkWallet(){
const p=window.okxwallet||window.ethereum;
if(p&&p.selectedAddress){this.account=p.selectedAddress;this.web3=new Web3(p)}}

async setDefaults(){
const beraChain=this.chains.find(c=>c.id==80094);
if(beraChain){
this.to.chain=beraChain;
document.getElementById('btn-to-chain').innerHTML=`<img src="${beraChain.logoURI||''}" style="width:20px;height:20px;border-radius:50%;margin-right:6px" onerror="this.style.display='none'"><span>${beraChain.name}</span>`;
try{
if(!this.tokens[80094]){
const d=await(await fetch('https://li.quest/v1/tokens?chains=80094')).json();
this.tokens[80094]=d.tokens[80094]||[]}
const beraToken=this.tokens[80094].find(t=>t.address=='0x0000000000000000000000000000000000000000');
if(beraToken){
this.to.token=beraToken;
document.getElementById('btn-to-token').innerHTML=`<img src="${beraToken.logoURI||''}" style="width:20px;height:20px;border-radius:50%;margin-right:6px" onerror="this.style.display='none'"><span>${beraToken.symbol}</span>`;
this.upToBal()}}catch(e){console.error(e)}}}

renderUI(c){c.innerHTML=`<style>#amt::-webkit-outer-spin-button,#amt::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}#amt[type=number]{-moz-appearance:textfield}</style><div style="max-width:480px;margin:0 auto;padding:0 10px">
<div style="background:rgba(0,0,0,.3);border:2px solid rgba(0,212,255,.2);border-radius:15px;padding:16px;margin-bottom:10px">
<div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:12px;color:var(--text-secondary)"><span>FROM</span><span id="bal-from">Balance: --</span></div>
<div style="display:flex;gap:10px;margin-bottom:10px">
<button onclick="lifiWidget.openModal('from','chain')" style="min-width:140px;padding:8px 12px;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.3);border-radius:10px;color:#fff;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center" id="btn-from-chain">Select Chain</button>
<button onclick="lifiWidget.openModal('from','token')" style="flex:1;padding:8px 12px;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.3);border-radius:10px;color:#fff;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center" id="btn-from-token">Select Token</button>
</div>
<input type="number" id="amt" placeholder="0.0" style="width:100%;padding:12px;background:rgba(0,0,0,.5);border:1px solid rgba(0,212,255,.2);border-radius:10px;color:#fff;font-size:20px;font-weight:600;text-align:right" oninput="lifiWidget.onAmt()" onwheel="this.blur()">
</div>
<div style="background:rgba(0,0,0,.3);border:2px solid rgba(0,212,255,.2);border-radius:15px;padding:16px;margin-bottom:15px">
<div style="display:flex;justify-content:space-between;margin-bottom:10px;font-size:12px;color:var(--text-secondary)"><span>TO</span><span id="bal-to">Balance: --</span></div>
<div style="display:flex;gap:10px;margin-bottom:10px">
<button onclick="lifiWidget.openModal('to','chain')" style="min-width:140px;padding:8px 12px;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.3);border-radius:10px;color:#fff;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center" id="btn-to-chain">Select Chain</button>
<button onclick="lifiWidget.openModal('to','token')" style="flex:1;padding:8px 12px;background:rgba(0,212,255,.1);border:1px solid rgba(0,212,255,.3);border-radius:10px;color:#fff;cursor:pointer;font-size:14px;font-weight:600;display:flex;align-items:center;justify-content:center" id="btn-to-token">Select Token</button>
</div>
<input type="text" id="est" placeholder="0.0" readonly style="width:100%;padding:12px;background:rgba(0,0,0,.5);border:1px solid rgba(0,212,255,.2);border-radius:10px;color:var(--text-secondary);font-size:20px;font-weight:600;text-align:right">
</div>
<div id="rt" style="display:none;background:rgba(0,0,0,.2);border:1px solid rgba(0,212,255,.2);border-radius:12px;padding:12px;margin-bottom:15px;font-size:13px">
<div id="steps" style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid rgba(0,212,255,.2)"></div>
<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:var(--text-secondary)">Gas</span><span id="gas" style="color:#fff;font-weight:600">--</span></div>
<div style="display:flex;justify-content:space-between;padding:6px 0"><span style="color:var(--text-secondary)">Time</span><span id="time" style="color:#fff;font-weight:600">--</span></div>
</div>
<div id="msg" style="display:none;padding:12px;border-radius:10px;margin-bottom:15px;font-size:13px"></div>
<button id="act" onclick="lifiWidget.act()" disabled style="width:100%;padding:16px;background:var(--primary-gradient);border:none;border-radius:12px;color:#fff;font-size:16px;font-weight:700;cursor:pointer;opacity:.5">Enter Amount</button>
<div id="mdl" style="display:none;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.8);z-index:9999;padding:20px;overflow-y:auto" onclick="if(event.target.id=='mdl')lifiWidget.closeMdl()">
<div style="max-width:420px;margin:50px auto;background:linear-gradient(135deg,rgba(0,212,255,.1),rgba(255,0,255,.1));border:2px solid rgba(0,212,255,.5);border-radius:20px;padding:20px">
<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px">
<h3 id="mdl-title" style="color:#fff;margin:0">Select</h3>
<button onclick="lifiWidget.closeMdl()" style="background:none;border:none;color:#fff;font-size:24px;cursor:pointer">&times;</button>
</div>
<input type="text" id="srch" placeholder="Search..." style="width:100%;padding:10px;background:rgba(0,0,0,.3);border:1px solid rgba(0,212,255,.3);border-radius:10px;color:#fff;margin-bottom:15px" oninput="lifiWidget.flt()">
<div id="lst" style="max-height:400px;overflow-y:auto"></div>
</div></div></div>`}

async openModal(side,type){
this.modalSide=side;this.modalType=type;
document.getElementById('mdl-title').textContent=type=='chain'?'Select Chain':'Select Token';
const l=document.getElementById('lst');
if(type=='chain'){
l.innerHTML=this.chains.map(c=>`<div onclick="lifiWidget.sel('${c.id}')" style="padding:12px;margin:5px 0;background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.2);border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px" onmouseover="this.style.background='rgba(0,212,255,.15)'" onmouseout="this.style.background='rgba(0,212,255,.05)'">
<img src="${c.logoURI||''}" style="width:24px;height:24px;border-radius:50%" onerror="this.style.display='none'">
<span style="color:#fff;font-weight:600">${c.name}</span>
</div>`).join('')
}else{
const cid=this[side].chain?.id;
if(!cid){this.shw('Select chain first','error');return}
l.innerHTML='<div style="text-align:center;padding:30px;color:var(--text-secondary)">Loading...</div>';
try{
if(!this.tokens[cid]){
const d=await(await fetch(`https://li.quest/v1/tokens?chains=${cid}`)).json();
this.tokens[cid]=d.tokens[cid]||[]}
let ts=this.tokens[cid].slice(0,100);
if(this.web3&&this.account){
await this.fetchBal(ts,cid,side=='from');
ts.sort((a,b)=>(b.bal||0)-(a.bal||0))}
if(cid==80094){
const beraIdx=ts.findIndex(t=>t.address=='0x0000000000000000000000000000000000000000');
const dpIdx=ts.findIndex(t=>t.address.toLowerCase()=='0xf7c464c7832e59855aa245ecc7677f54b3460e7d');
const priority=[];
if(beraIdx>-1)priority.push(ts.splice(beraIdx,1)[0]);
if(dpIdx>-1)priority.push(ts.splice(dpIdx-(beraIdx<dpIdx?1:0),1)[0]);
ts=priority.concat(ts)}
l.innerHTML=ts.map(t=>`<div onclick="lifiWidget.sel('${t.address}')" style="padding:12px;margin:5px 0;background:rgba(0,212,255,.05);border:1px solid rgba(0,212,255,.2);border-radius:10px;cursor:pointer;display:flex;align-items:center;gap:10px" onmouseover="this.style.background='rgba(0,212,255,.15)'" onmouseout="this.style.background='rgba(0,212,255,.05)'">
<img src="${t.logoURI||''}" style="width:32px;height:32px;border-radius:50%" onerror="this.style.display='none'">
<div style="flex:1"><div style="color:#fff;font-weight:600">${t.symbol}</div><div style="color:var(--text-secondary);font-size:12px">${t.name}</div></div>
<div style="color:#28a745;font-weight:600;font-size:12px">${t.bal?t.bal.toFixed(4):''}</div>
</div>`).join('')
}catch(e){l.innerHTML='<div style="text-align:center;padding:30px;color:#dc3545">Failed</div>'}}
document.getElementById('mdl').style.display='block'}

sel(id){
if(this.modalType=='chain'){
const c=this.chains.find(x=>x.id==id);
if(c){this[this.modalSide].chain=c;
document.getElementById(`btn-${this.modalSide}-chain`).innerHTML=`<img src="${c.logoURI||''}" style="width:20px;height:20px;border-radius:50%;margin-right:6px" onerror="this.style.display='none'"><span>${c.name}</span>`}
}else{
const cid=this[this.modalSide].chain?.id;
const t=this.tokens[cid]?.find(x=>x.address==id);
if(t){this[this.modalSide].token=t;
document.getElementById(`btn-${this.modalSide}-token`).innerHTML=`<img src="${t.logoURI||''}" style="width:20px;height:20px;border-radius:50%;margin-right:6px" onerror="this.style.display='none'"><span>${t.symbol}</span>`;
if(this.modalSide=='from')this.upBal();else this.upToBal()}}
this.closeMdl()}

closeMdl(){document.getElementById('mdl').style.display='none'}

flt(){
const s=document.getElementById('srch').value.toLowerCase();
document.querySelectorAll('#lst>div').forEach(d=>d.style.display=d.textContent.toLowerCase().includes(s)?'flex':'none')}


async fetchBal(ts,cid,isFrom){
if(!this.account)return;
try{
const chain=this.chains.find(c=>c.id==cid);
let web3Inst;
if(this.web3){
const currentChainId=await this.web3.eth.getChainId();
if(currentChainId==cid){
web3Inst=this.web3}
else if(chain?.metamask?.rpcUrls?.[0]){
web3Inst=new Web3(chain.metamask.rpcUrls[0])}
else return}
else if(chain?.metamask?.rpcUrls?.[0]){
web3Inst=new Web3(chain.metamask.rpcUrls[0])}
else return;
const ps=ts.slice(0,20).map(async t=>{
try{
let b;
if(t.address=='0x0000000000000000000000000000000000000000'){
b=await web3Inst.eth.getBalance(this.account);b=parseFloat(web3Inst.utils.fromWei(b,'ether'))}
else{const ct=new web3Inst.eth.Contract([{constant:true,inputs:[{name:'_owner',type:'address'}],name:'balanceOf',outputs:[{name:'balance',type:'uint256'}],type:'function'}],t.address);
const bal=await ct.methods.balanceOf(this.account).call();b=parseFloat(bal)/Math.pow(10,t.decimals||18)}
t.bal=b>0?b:0}catch(e){t.bal=0}});
await Promise.all(ps)}catch(e){console.error(e)}}

async upBal(){
if(!this.account||!this.from.token||!this.from.chain)return;
try{
const chain=this.chains.find(c=>c.id==this.from.chain.id);
let web3Inst;
if(this.web3){
const currentChainId=await this.web3.eth.getChainId();
if(currentChainId==this.from.chain.id){
web3Inst=this.web3}
else if(chain?.metamask?.rpcUrls?.[0]){
web3Inst=new Web3(chain.metamask.rpcUrls[0])}
else return}
else if(chain?.metamask?.rpcUrls?.[0]){
web3Inst=new Web3(chain.metamask.rpcUrls[0])}
else return;
const t=this.from.token;
let b;
if(t.address=='0x0000000000000000000000000000000000000000'){
b=await web3Inst.eth.getBalance(this.account);b=web3Inst.utils.fromWei(b,'ether')
}else{const ct=new web3Inst.eth.Contract([{constant:true,inputs:[{name:'_owner',type:'address'}],name:'balanceOf',outputs:[{name:'balance',type:'uint256'}],type:'function'}],t.address);
b=await ct.methods.balanceOf(this.account).call();b=parseFloat(b)/Math.pow(10,t.decimals||18)}
document.getElementById('bal-from').textContent=`Balance: ${parseFloat(b).toFixed(4)}`}catch(e){console.error(e)}}

async upToBal(){
if(!this.account||!this.to.token||!this.to.chain)return;
try{const chain=this.chains.find(c=>c.id==this.to.chain.id);
if(!chain?.metamask?.rpcUrls?.[0])return;
const web3Inst=new Web3(chain.metamask.rpcUrls[0]);
const t=this.to.token;
let b;
if(t.address=='0x0000000000000000000000000000000000000000'){
b=await web3Inst.eth.getBalance(this.account);b=web3Inst.utils.fromWei(b,'ether')
}else{const ct=new web3Inst.eth.Contract([{constant:true,inputs:[{name:'_owner',type:'address'}],name:'balanceOf',outputs:[{name:'balance',type:'uint256'}],type:'function'}],t.address);
b=await ct.methods.balanceOf(this.account).call();b=parseFloat(b)/Math.pow(10,t.decimals||18)}
document.getElementById('bal-to').textContent=`Balance: ${parseFloat(b).toFixed(4)}`}catch(e){console.error(e)}}

onAmt(){
clearTimeout(this.timer);const a=document.getElementById('amt').value;
if(!a||parseFloat(a)<=0){document.getElementById('est').value='';document.getElementById('rt').style.display='none';this.upBtn('Enter Amount',true);return}
this.timer=setTimeout(()=>this.qt(),1000)}

async qt(){
if(!this.from.chain||!this.to.chain||!this.from.token||!this.to.token){this.shw('Select all','error');return}
const a=document.getElementById('amt').value;if(!a||parseFloat(a)<=0)return;
this.shw('🔍 Getting route...','info');
try{const amt=(parseFloat(a)*Math.pow(10,this.from.token.decimals||18)).toString();
const req={fromChainId:this.from.chain.id,toChainId:this.to.chain.id,fromTokenAddress:this.from.token.address,toTokenAddress:this.to.token.address,fromAddress:this.account||'0x0000000000000000000000000000000000000000',fromAmount:amt,options:{slippage:0.05,allowSwitchChain:true,order:'RECOMMENDED'}};
console.log('📝 Request:',{from:`${this.from.token.symbol} (${this.from.token.address})`,to:`${this.to.token.symbol} (${this.to.token.address})`,fromChain:this.from.chain.name,toChain:this.to.chain.name});
const res=await this.sdk.getRoutes(req);
if(res.routes&&res.routes.length>0){this.route=res.routes[0];
console.log('🛣️ Route:',{toToken:this.route.toToken?.symbol||'Unknown',toTokenAddr:this.route.toToken?.address,toAmount:this.route.toAmount,steps:this.route.steps.length});
console.log('📋 Route steps:',this.route.steps.map((s,i)=>({step:i+1,type:s.type,tool:s.tool,from:`${s.action.fromToken?.symbol}@${s.action.fromChainId}`,to:`${s.action.toToken?.symbol}@${s.action.toChainId}`})));
const est=parseFloat(this.route.toAmount)/Math.pow(10,this.to.token.decimals||18);
document.getElementById('est').value=est.toFixed(6);
const gas=this.route.gasCostUSD?`$${parseFloat(this.route.gasCostUSD).toFixed(2)}`:'--';
const time=this.route.steps[0]?.estimate?.executionDuration?`~${Math.ceil(this.route.steps[0].estimate.executionDuration/60)} min`:'--';
document.getElementById('gas').textContent=gas;
document.getElementById('time').textContent=time;
const stepsHtml=this.route.steps.map((s,i)=>`<div style="padding:4px 0;color:var(--text-secondary);font-size:11px">➡️ Step ${i+1}: ${(s.type||'').toUpperCase()} via ${s.toolDetails?.name||s.tool}</div>`).join('');
document.getElementById('steps').innerHTML=stepsHtml;
document.getElementById('rt').style.display='block';
this.upBtn('Bridge',false);this.shw('✅ Route found!','success')
}else{this.shw('❌ No route','error')}}catch(e){console.error(e);this.shw('Failed: '+e.message,'error')}}

async act(){
if(!this.account){this.shw('Connect wallet','error');return}
if(!this.route){this.shw('Get quote first','error');return}
if(!this.from.chain){this.shw('No from chain selected','error');return}
const currentChainId=await this.web3.eth.getChainId();
if(currentChainId!=this.from.chain.id){
this.shw(`🔄 Switching to ${this.from.chain.name}...`,'info');
window.lifi_switching=true;
const switched=await this.switchChain(this.from.chain.id);
if(!switched){window.lifi_switching=false;this.shw(`Failed to switch to ${this.from.chain.name}`,'error');return}
await new Promise(r=>setTimeout(r,2000));
window.lifi_switching=false}
this.shw('🚀 Executing...','info');
console.log('🚀 Executing route to:',this.route.toToken?.symbol||'Unknown',this.route.toToken?.address);
try{const p=window.okxwallet||window.ethereum;
const signer=new ethers.providers.Web3Provider(p).getSigner();
await this.sdk.executeRoute(signer,this.route,{updateRouteHook:async(route)=>{console.log('📊 Route updated');this.route=route;this.shw('🔄 Route updated...','info');return route},acceptSlippageUpdateHook:async(oldR,newR)=>{console.log('⚠️ Slippage changed, auto-accepting');return true},infiniteApproval:false});
this.shw('✅ Completed!','success');
document.getElementById('amt').value='';document.getElementById('est').value='';
document.getElementById('rt').style.display='none';this.route=null;this.upBtn('Enter Amount',true);
setTimeout(()=>{this.upBal();this.upToBal()},3000)
}catch(e){console.error('❌ Execution error:',e);
if(e.code)console.error('Error code:',e.code);
if(e.data)console.error('Error data:',e.data);
if(e.message?.includes('rate')||e.message?.includes('slippage')){this.shw('⚠️ Price changed, please retry','error')}else if(e.message?.includes('user rejected')||e.code===4001){this.shw('Transaction cancelled','error')}else{this.shw('Failed: '+e.message,'error')}}}

shw(txt,type){
const m=document.getElementById('msg');m.textContent=txt;m.style.display=txt?'block':'none';
m.style.background=type=='error'?'#ffebee':type=='success'?'#e8f5e9':'#e3f2fd';
m.style.color=type=='error'?'#721c24':type=='success'?'#155724':'#0d47a1';
m.style.border=`1px solid ${type=='error'?'#dc3545':type=='success'?'#28a745':'#2196f3'}`;
if(type=='success'||type=='error')setTimeout(()=>m.style.display='none',5000)}

upBtn(txt,dis){
const b=document.getElementById('act');b.textContent=txt;b.disabled=dis;
b.style.opacity=dis?'.5':'1';b.style.cursor=dis?'not-allowed':'pointer'}

async switchChain(chainId){
if(!this.web3)return false;
try{
const hexChainId='0x'+Number(chainId).toString(16);
const p=window.okxwallet||window.ethereum;
await p.request({method:'wallet_switchEthereumChain',params:[{chainId:hexChainId}]});
await new Promise(r=>setTimeout(r,1000));
return true}catch(e){
console.error('Switch chain failed:',e);
if(e.code===4902)this.shw('Please add this chain in wallet','error');
return false}}}

window.lifiWidget=new LiFiBridge();
window.addEventListener('load',()=>lifiWidget.init());
