const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/auth-api-_KeJNBLx.js","assets/auth-api-Daieo5UL.js","assets/http-XXUaF3qr.js","assets/game-scene-to4DleEc.js","assets/ws-client-gT_Uq5ie.js"])))=>i.map(i=>d[i]);
import{n as e,r as t,t as n}from"./http-XXUaF3qr.js";import{a as r,i,n as a,r as o,t as s}from"./ws-client-gT_Uq5ie.js";import{a as c,i as ee,n as te,o as l,r as u,t as ne}from"./auth-api-Daieo5UL.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();function re(e){return t(`/api/rooms`,{method:`POST`,body:JSON.stringify({name:e,maxPlayers:10,aiDeerCount:16,publicRoom:!0})})}function ie(e){return t(`/api/rooms/${String(e)}/join`,{method:`POST`})}function ae(e){return t(`/api/rooms/join-by-code/${encodeURIComponent(e)}`,{method:`POST`})}function oe(){return t(`/api/rooms/current`)}function se(e){return t(`/api/rooms/${String(e)}/leave`,{method:`POST`})}function ce(e,n,r=``){return t(`/api/rooms/${String(e)}/kick`,{method:`POST`,body:JSON.stringify({targetUserId:n,reason:r})})}function le(e,n){return t(`/api/rooms/${String(e)}/ready`,{method:`POST`,body:JSON.stringify({ready:n})})}function ue(e){return t(`/api/rooms/${String(e)}/start`,{method:`POST`})}function de(e,n=30){return t(`/api/rooms/${String(e)}/chat?limit=${n}`)}function fe(e,n){return t(`/api/rooms/${String(e)}/chat`,{method:`POST`,body:JSON.stringify({content:n})})}function pe(){return t(`/api/lobby/summary`)}function me(){return t(`/api/rooms`)}function he(e=`TROPHY`){return t(`/api/leaderboard/top?type=${encodeURIComponent(e)}&limit=10`)}function ge(e){return t(`/api/matchmaking/queue`,{method:`POST`,body:JSON.stringify({queueType:e})})}function _e(){return t(`/api/matchmaking/cancel`,{method:`POST`})}function d(){return t(`/api/friends`)}function ve(e){return t(`/api/friends/search?keyword=${encodeURIComponent(e)}`)}function f(){return t(`/api/friends/requests`)}function ye(e){return t(`/api/friends/requests`,{method:`POST`,body:JSON.stringify({username:e})})}function be(e,n){return t(`/api/friends/room-requests`,{method:`POST`,body:JSON.stringify({roomId:e,targetUserId:n})})}function xe(e){return t(`/api/friends/requests/${encodeURIComponent(e)}/accept`,{method:`POST`})}function Se(e){return t(`/api/friends/requests/${encodeURIComponent(e)}/reject`,{method:`POST`})}function Ce(e,n){return t(`/api/invites/friend`,{method:`POST`,body:JSON.stringify({roomId:e,friendUserId:n})})}function we(e){return t(`/api/invites/${encodeURIComponent(e)}/accept`,{method:`POST`})}function Te(e){return t(`/api/invites/${encodeURIComponent(e)}/reject`,{method:`POST`})}function p(){return t(`/api/chats/friends`)}function Ee(e,n=50){return t(`/api/chats/friends/${String(e)}?limit=${n}`)}function De(e,n){return t(`/api/chats/friends/${String(e)}`,{method:`POST`,body:JSON.stringify({content:n})})}function Oe(e){return t(`/api/chats/friends/${String(e)}/read`,{method:`POST`})}function ke(){return t(`/api/checkin/status`)}function Ae(){return t(`/api/checkin/claim`,{method:`POST`})}function je(){return t(`/api/activities`)}function Me(e){return t(`/api/activities/${String(e)}/claim`,{method:`POST`})}function Ne(){return t(`/api/season-pass`)}function Pe(e,n){return t(`/api/season-pass/rewards/${e}/${String(n)}/claim`,{method:`POST`})}function Fe(){return t(`/api/season-pass/premium/unlock`,{method:`POST`})}function Ie(){return t(`/api/notifications`)}function Le(){return t(`/api/notifications/unread-count`)}function Re(e){return t(`/api/notifications/${String(e)}/read`,{method:`POST`})}function ze(){return t(`/api/notifications/read-all`,{method:`POST`})}function Be(){return t(`/api/users/me/guide-seen`,{method:`POST`})}function Ve(e){return t(`/api/users/${String(e)}/profile`)}function m(e){let t=document.querySelector(`#toast-root`);if(!t)return;let n=document.createElement(`div`);n.className=`toast`,n.textContent=e,t.append(n),window.setTimeout(()=>n.remove(),2600)}function h(e,t){e.disabled=t,e.dataset.loading=t?`true`:`false`}function g(e){window.history.replaceState(null,``,e===`lobby`?`/`:`#${e}`)}function He(t,n){let r=new s,i=String(t),a=r.connect(`/ws/room?roomId=${encodeURIComponent(i)}&token=${encodeURIComponent(e()??``)}`,n);a.addEventListener(`open`,()=>r.send({type:`JOIN_ROOM`,roomId:i,token:e()??``}));let o=window.setInterval(()=>r.send({type:`PING`,roomId:i,sentAt:Date.now()}),1e4);return a.addEventListener(`close`,()=>window.clearInterval(o)),r}function Ue(t){let n=new s;return n.connect(`/ws/lobby?token=${encodeURIComponent(e()??``)}`,t),n}function We(e){return e.length===0?`
      <article class="room-empty-state">
        <strong>暂无玩家自建房间</strong>
        <span>创建房间后会显示在这里，系统匹配房间不会进入大厅列表。</span>
      </article>
    `:e.map((e,t)=>`
    <article class="room-row" data-room-id="${e.id}" data-room-code="${e.roomCode}" data-room-name="${Ge(e.name)}" data-member-count="${e.memberCount}" data-max-players="${e.maxPlayers}" data-ai-deer-count="${e.aiDeerCount}">
      <span class="room-thumb icon-sprite icon-room-${t%3+1}" aria-hidden="true"></span>
      <div>
        <strong>${Ge(e.name)} ${e.roomCode}</strong>
        <span>${e.status===`WAITING`?`经典模式`:e.status}</span>
      </div>
      <b>${e.memberCount}/${e.maxPlayers}</b>
      <i class="signal-bars" aria-hidden="true"><span></span><span></span><span></span></i>
      <button class="join-room-btn" data-room-id="${e.id}" type="button">加入</button>
    </article>
  `).join(``)}function Ge(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#039;`})[e]??e)}var Ke=`/assets/kspp-Bj_zt-KN.png`,qe=`/assets/lang-BhBKWxzo.png`,Je=`/assets/milu-DQLwZQYH.png`,Ye=`/assets/lang-tag-XEqUDXAw.png`,Xe=`/assets/milu-tag-BWD2vY0g.png`,Ze=`/assets/cjfj-BZtpxLGn.png`,Qe=`/assets/jrfj-oFsQyxq3.png`;function $e(){return`
    <section class="quick-match-card wood-panel">
      <img class="quick-title-image" src="${Ke}" alt="快速匹配" />
      <button id="match-wolf-btn" class="role-card wolf-card" type="button">
        <img class="role-portrait role-portrait-image" src="${qe}" alt="" />
        <span class="role-copy">
          <strong>匹配为狼</strong>
          <small>寻找鹿群，找出所有真人鹿</small>
          <em>在线玩家：1280</em>
        </span>
        <img class="role-tag-image" src="${Ye}" alt="" />
      </button>
      <button id="match-deer-btn" class="role-card deer-card" type="button">
        <img class="role-portrait role-portrait-image deer-portrait-image" src="${Je}" alt="" />
        <span class="role-copy">
          <strong>匹配为鹿</strong>
          <small>隐藏在鹿群中，存活到时间结束</small>
          <em>在线玩家：3420</em>
        </span>
        <img class="role-tag-image" src="${Xe}" alt="" />
      </button>
      <div class="custom-room-card">
        <h3>自定义房间</h3>
        <div class="custom-actions">
          <button id="create-room-btn" class="blue-action" type="button">
            <img class="mini-icon" src="${Ze}" alt="" />
            <span><strong>创建房间</strong><small>创建属于你的狩猎房间</small></span>
          </button>
          <button id="join-room-code-btn" class="purple-action" type="button">
            <img class="mini-icon" src="${Qe}" alt="" />
            <span><strong>加入房间</strong><small>输入房间号，加入游戏</small></span>
          </button>
        </div>
      </div>
      <p id="match-status" class="match-status"></p>
    </section>
  `}function et(){return`
    <dialog id="create-room-dialog">
      <form method="dialog" class="wild-dialog">
        <p class="section-label">新建房间</p>
        <h2>房间设置</h2>
        <label>
          房间名
          <input id="room-name-input" maxlength="32" value="WildHunt 房间" />
        </label>
        <menu>
          <button value="cancel" type="submit">取消</button>
          <button id="confirm-create-room" value="default" type="button">创建</button>
        </menu>
      </form>
    </dialog>
  `}function tt(e=``){return`
    <section class="invite-copy-panel parchment-panel">
      <h2>房间邀请</h2>
      <div class="invite-copy">
        <input id="invite-link-input" readonly value="${e}" placeholder="进入房间后生成邀请链接" />
        <button id="copy-invite-btn" type="button">复制</button>
      </div>
    </section>
  `}var _=[{type:`TROPHY`,label:`奖杯榜`,metric:`奖杯`},{type:`WINS`,label:`胜场榜`,metric:`胜场`}],nt=[{rank:1,userId:`1`,nickname:`狼王之王`,leaderboardType:`TROPHY`,score:620,rating:2450,level:8,trophies:620,wins:7,wolfWins:4,deerSurvivals:3},{rank:2,userId:`2`,nickname:`ForestKiller`,leaderboardType:`TROPHY`,score:540,rating:1980,level:6,trophies:540,wins:5,wolfWins:3,deerSurvivals:2},{rank:3,userId:`3`,nickname:`NightHowl`,leaderboardType:`TROPHY`,score:490,rating:1750,level:5,trophies:490,wins:4,wolfWins:2,deerSurvivals:2},{rank:4,userId:`4`,nickname:`DeerMaster`,leaderboardType:`TROPHY`,score:430,rating:1520,level:5,trophies:430,wins:4,wolfWins:1,deerSurvivals:3},{rank:5,userId:`5`,nickname:`风之追猎者`,leaderboardType:`TROPHY`,score:380,rating:1280,level:4,trophies:380,wins:3,wolfWins:2,deerSurvivals:1}];function v(e,t=`TROPHY`){let n=e.length?e:nt,r=_.find(e=>e.type===t)??_[0],i=n.map((e,n)=>{let i=rt(e,t);return`
      <li>
        <span class="rank-badge rank-${e.rank<=3?e.rank:`plain`}">${e.rank}</span>
        <i class="board-avatar icon-sprite ${n%3==0?`icon-wolf`:n%3==1?`icon-deer`:`icon-squirrel`}" aria-hidden="true"></i>
        <strong>${it(e.nickname)}<small>Lv.${e.level??1}</small></strong>
        <b><span class="tiny-trophy icon-sprite icon-trophy" aria-hidden="true"></span>${i}<small>${r.metric}</small></b>
      </li>
    `}).join(``);return`
    <section class="leaderboard-card parchment-panel">
      <h2>排行榜</h2>
      <div class="board-tabs" role="tablist" aria-label="排行榜切换">
        ${_.map(e=>`
          <button class="${e.type===t?`active`:``}" type="button" role="tab" aria-selected="${e.type===t}" data-leaderboard-type="${e.type}">
            ${e.label}
          </button>
        `).join(``)}
      </div>
      <ol class="leaderboard-list">${i}</ol>
    </section>
  `}function rt(e,t){return typeof e.score==`number`&&e.leaderboardType===t?e.score:t===`WINS`?e.wins:e.trophies??e.rating}function it(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#039;`})[e]??e)}var at=`/assets/logo-BWKAfp2W.png`,ot=`/assets/fjlb-DellmlU-.png`,st=`data:image/svg+xml,%3csvg%20t='1779607400414'%20class='icon'%20viewBox='0%200%201024%201024'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20p-id='6267'%20width='200'%20height='200'%3e%3cpath%20d='M566.55497187%2051.95428531a77.02857187%2077.02857187%200%200%200-103.47428625%200L44.68068594%20449.16571437a38.5828575%2038.5828575%200%200%200%2051.67999969%2057.32571375l6.65142843-6.33142781V914.74285719A77.16571406%2077.16571406%200%200%200%20180.2235425%20992h224.64V759.65714281a54.33142875%2054.33142875%200%200%201%2054.37714313-54.40000031h105.69142875a54.35428594%2054.35428594%200%200%201%2054.40000031%2054.40000031V992h229.94285719a77.23428563%2077.23428563%200%200%200%2077.23428562-77.25714281V505.21142844c17.14285687%2015.52000031%2041.4628575%2014.33142844%2055.74857063-1.55428594a38.5828575%2038.5828575%200%200%200-2.78857125-54.51428531L566.55497187%2051.9771425z'%20fill='%23CCCCCC'%20p-id='6268'%3e%3c/path%3e%3c/svg%3e`,ct=`data:image/svg+xml,%3csvg%20t='1779607520961'%20class='icon'%20viewBox='0%200%201464%201024'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20p-id='10165'%20width='200'%20height='200'%3e%3cpath%20d='M126.671616%201023.979218a262.134901%20262.134901%200%200%200%2057.622446-5.667782%20315.506512%20315.506512%200%200%200%20149.251584-83.599779C377.943269%20893.147925%20425.174782%20850.167248%20472.406296%20810.492776a402.884812%20402.884812%200%200%201%20340.539214-76.042737%20519.546651%20519.546651%200%200%201%20200.733934%2099.658494c55.260871%2041.091417%20109.104797%2084.072094%20164.365668%20125.163511a320.701978%20320.701978%200%200%200%20111.938687%2056.205502%20112.411003%20112.411003%200%200%200%20145.000747-70.847271%20356.125614%20356.125614%200%200%200%2029.283539-130.358978%20999.418831%20999.418831%200%200%200-27.866593-272.525834%201095.771119%201095.771119%200%200%200-148.306953-360.37645A438.308448%20438.308448%200%200%200%201133.647489%2030.700484a188.926055%20188.926055%200%200%200-179.479753-13.224824c-31.645114%2014.641769-64.234859%2026.921963-94.463027%2041.091417a288.584549%20288.584549%200%200%201-240.408405%204.250836c-38.257526-16.53103-76.987367-30.700484-114.772578-47.231513A178.062807%20178.062807%200%200%200%20345.353524%2023.615757a392.966194%20392.966194%200%200%200-141.694541%20123.746566%20944.630275%20944.630275%200%200%200-136.499075%20266.858053A1174.647747%201174.647747%200%200%200%200.091159%20772.707565v18.892605a401.940182%20401.940182%200%200%200%2028.811223%20158.225572%20108.160166%20108.160166%200%200%200%2097.769234%2074.153476zM1222.91505%20377.85211a44.397623%2044.397623%200%200%201%2042.980677%2047.231514%2043.452993%2043.452993%200%200%201-44.869938%2042.980677%2047.231514%2047.231514%200%200%201-43.925308-43.925308%2047.231514%2047.231514%200%200%201%2045.814569-46.286883z%20m-134.137499%20221.5158a43.925308%2043.925308%200%200%201-44.869938-44.397623%2047.231514%2047.231514%200%200%201%2044.869938-43.925308%2044.397623%2044.397623%200%200%201%200%2088.322931z%20m0-354.708669a44.397623%2044.397623%200%200%201%2042.980677%2047.231514A43.452993%2043.452993%200%200%201%201086.415975%20330.620596a44.397623%2044.397623%200%201%201%200-88.32293zM952.750791%20377.85211a44.397623%2044.397623%200%200%201%2043.925308%2044.397623%2043.925308%2043.925308%200%200%201-43.925308%2043.925308%2044.397623%2044.397623%200%201%201%200-88.322931zM422.340892%20177.118177A199.789303%20199.789303%200%201%201%20222.079273%20377.85211a200.261618%20200.261618%200%200%201%20200.261619-200.733933z'%20p-id='10166'%3e%3c/path%3e%3cpath%20d='M422.340892%20487.429222A110.994057%20110.994057%200%201%200%20311.346834%20377.85211a110.049427%20110.049427%200%200%200%20110.994058%20109.577112z'%20p-id='10167'%3e%3c/path%3e%3c/svg%3e`,lt=`data:image/svg+xml,%3csvg%20t='1779607464754'%20class='icon'%20viewBox='0%200%201024%201024'%20version='1.1'%20xmlns='http://www.w3.org/2000/svg'%20p-id='8160'%20width='200'%20height='200'%3e%3cpath%20d='M919.6%20405.6l-57.2-8c-12.7-1.8-23-10.4-28-22.1-11.3-26.7-25.7-51.7-42.9-74.5-7.7-10.2-10-23.5-5.2-35.3l21.7-53.5c6.7-16.4%200.2-35.3-15.2-44.1L669.1%2096.6c-15.4-8.9-34.9-5.1-45.8%208.9l-35.4%2045.3c-7.9%2010.2-20.7%2014.9-33.5%2013.3-14-1.8-28.3-2.8-42.8-2.8-14.5%200-28.8%201-42.8%202.8-12.8%201.6-25.6-3.1-33.5-13.3l-35.4-45.3c-10.9-14-30.4-17.8-45.8-8.9L230.4%20168c-15.4%208.9-21.8%2027.7-15.2%2044.1l21.7%2053.5c4.8%2011.9%202.5%2025.1-5.2%2035.3-17.2%2022.8-31.7%2047.8-42.9%2074.5-5%2011.8-15.3%2020.4-28%2022.1l-57.2%208C86%20408%2072.9%20423%2072.9%20440.8v142.9c0%2017.7%2013.1%2032.7%2030.6%2035.2l57.2%208c12.7%201.8%2023%2010.4%2028%2022.1%2011.3%2026.7%2025.7%2051.7%2042.9%2074.5%207.7%2010.2%2010%2023.5%205.2%2035.3l-21.7%2053.5c-6.7%2016.4-0.2%2035.3%2015.2%2044.1L354%20927.8c15.4%208.9%2034.9%205.1%2045.8-8.9l35.4-45.3c7.9-10.2%2020.7-14.9%2033.5-13.3%2014%201.8%2028.3%202.8%2042.8%202.8%2014.5%200%2028.8-1%2042.8-2.8%2012.8-1.6%2025.6%203.1%2033.5%2013.3l35.4%2045.3c10.9%2014%2030.4%2017.8%2045.8%208.9l123.7-71.4c15.4-8.9%2021.8-27.7%2015.2-44.1l-21.7-53.5c-4.8-11.8-2.5-25.1%205.2-35.3%2017.2-22.8%2031.7-47.8%2042.9-74.5%205-11.8%2015.3-20.4%2028-22.1l57.2-8c17.6-2.5%2030.6-17.5%2030.6-35.2V440.8c0.2-17.8-12.9-32.8-30.5-35.2z%20m-408%20245.5c-76.7%200-138.9-62.2-138.9-138.9s62.2-138.9%20138.9-138.9%20138.9%2062.2%20138.9%20138.9-62.2%20138.9-138.9%20138.9z'%20fill=''%20p-id='8161'%3e%3c/path%3e%3c/svg%3e`,ut=`/assets/qiandao-mJiG81t0.png`,dt=`/assets/huodong-C9bclE9t.png`,ft=`/assets/xingshouzhinan-BsANZ5Cm.png`,pt=`/assets/xiaoxi-Clw5UlY6.png`,mt=`modulepreload`,ht=function(e){return`/`+e},gt={},y=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e=document.getElementsByTagName(`link`),i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}r=o(t.map(t=>{if(t=ht(t,n),t in gt)return;gt[t]=!0;let r=t.endsWith(`.css`),i=r?`[rel="stylesheet"]`:``;if(n)for(let n=e.length-1;n>=0;n--){let i=e[n];if(i.href===t&&(!r||i.rel===`stylesheet`))return}else if(document.querySelector(`link[href="${t}"]${i}`))return;let o=document.createElement(`link`);if(o.rel=r?`stylesheet`:mt,r||(o.as=`script`),o.crossOrigin=``,o.href=t,a&&o.setAttribute(`nonce`,a),document.head.appendChild(o),r)return new Promise((e,n)=>{o.addEventListener(`load`,e),o.addEventListener(`error`,()=>n(Error(`Unable to preload CSS for ${t}`)))})}))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},b=[],x=[],S=`TROPHY`,C=null,w=`lobby`,T=null,E=[],D=null,O=null,k=[],A=null,j=[],M=null,N=[],P=[],F={received:[],sent:[]},I=null,L=[],R=null,_t=`wildhunt.match.options`,vt=`wildhunt.handledInvites`;async function z(e){T=e??T,g(`lobby`);let t=document.querySelector(`#app`);if(!t)throw Error(`Missing #app root`);let n=V();t.innerHTML=`
    <main class="lobby-root">
      <div id="toast-root"></div>
      <header class="lobby-topbar">
        <div class="brand-mark" aria-label="WildHunt 荒野追猎">
          <img src="${at}" alt="WildHunt 荒野追猎" />
        </div>
        <nav class="top-nav" aria-label="大厅导航">
          <button id="lobby-tab-btn" class="active" type="button"><img class="nav-icon" src="${st}" alt="" />大厅</button>
          <button id="room-tab-btn" type="button"><img class="nav-icon" src="${ct}" alt="" />房间<span id="room-stay-badge" class="room-stay-badge"></span></button>
          <button id="settings-btn" type="button"><img class="nav-icon" src="${lt}" alt="" />设置</button>
        </nav>
        <section class="player-card">
          <span class="player-avatar icon-sprite icon-deer"></span>
          <div>
            <strong>${Q(T?.nickname??`Hunter_001`)}</strong>
            <small>Lv.${T?.level??1} · ${Q(T?.title??`新晋猎手`)}</small>
            <i><span style="width: ${Math.min(100,(T?.exp??0)%1e3/10)}%"></span></i>
          </div>
          <b>${T?.exp??0}/1000 · ${T?.trophies??0} 杯</b>
          <button id="message-panel-btn" class="icon-button message-button ${n>0?`has-dot`:``}" type="button" aria-label="消息"><img src="${pt}" alt="" /><span id="message-count">${n}</span></button>
        </section>
      </header>
      <section class="lobby-shell">
        <section id="room-scene-view" class="room-scene-view">${Ot(C)}</section>
        <aside class="left-column">
          ${$e()}
        </aside>
        <section class="center-column">
          <div class="room-title-row">
            <img class="room-title-image" src="${ot}" alt="房间列表" />
            <button id="refresh-lobby-btn" class="refresh-btn" type="button" aria-label="刷新房间">↻</button>
          </div>
          <section class="rooms-card parchment-panel">
            <div id="room-list" class="room-list">${We(b)}</div>
          </section>
        </section>
        <aside class="right-column">
          <div id="leaderboard-panel">${v(x,S)}</div>
          <section class="friends-card parchment-panel">
            <div class="friends-card-header">
              <h2>好友在线 <small>（${k.length}）</small></h2>
              <button id="add-friend-btn" type="button">加好友</button>
            </div>
            ${At()}
          </section>
          <section class="room-waiting" id="room-waiting">${_n(C)}</section>
        </aside>
      </section>
      <section class="bottom-dock">
        <button id="season-pass-btn" class="season-pass" type="button">
          <span>${M?.level??1}</span>
          <strong>赛季通行证</strong>
          <small>${M?`${M.expIntoLevel}/${M.expForNextLevel||`MAX`}`:`--/--`}</small>
          <i><b style="width: ${M?.progressPercent??0}%"></b></i>
        </button>
        <button id="checkin-btn" class="dock-item" type="button"><img src="${ut}" alt="" /><strong>每日签到</strong><small>${A?.claimedToday?`已签到`:`可领取`}</small></button>
        <button id="activity-btn" class="dock-item" type="button"><span class="dock-icon has-dot"><img src="${dt}" alt="" /></span><strong>活动中心</strong><small>${j.filter(e=>e.claimable).length} 个可领</small></button>
        <button id="guide-btn" class="dock-item" type="button"><img src="${ft}" alt="" /><strong>新手指南</strong><small>${T?.guideSeen?`已查看`:`了解玩法`}</small></button>
        <button id="local-game-btn" class="start-game-btn" type="button" aria-label="开始游戏"></button>
      </section>
      ${et()}
      <dialog id="lobby-modal" class="lobby-modal"></dialog>
      <section class="lobby-stats" id="lobby-stats" aria-live="polite">
        <span>在线 --</span><span>等待 --</span><span>对局 --</span>
      </section>
    </main>
  `,Tt(),a.unlockOnFirstGesture(),Dt(),await yt()}async function yt(){try{R=document.querySelector(`#lobby-modal`),await B(),await bt();let e=await r().catch(()=>null);if(e&&T){let t=e.players.find(e=>!e.ai&&String(e.userId)===String(T?.userId));if(t?.roleType===`WOLF`||t?.roleType===`DEER`){await $(t.roleType===`WOLF`?`wolf`:`deer`,{userId:T.userId,matchId:e.matchId,roomId:e.roomId,assignedRole:t.roleType,matchSeed:e.matchSeed,gameConfig:e.gameConfig});return}}C=await oe(),C&&(await Rt(C.id),zt(C.id)),Bt();let t=new URLSearchParams(window.location.search).get(`invite`);t&&await q(await ae(t),`room`),T&&!T.guideSeen&&Zt(!0),W()}catch(e){m(`后端暂未连接，已进入离线大厅：${e instanceof Error?e.message:`unknown`}`),W()}}async function B(){let[e,t,n]=await Promise.all([pe(),me(),he(S)]);b=t,x=n;let r=document.querySelector(`#lobby-stats`);r&&(r.innerHTML=`
      <span>在线 ${e.onlinePlayers}</span>
      <span>等待 ${e.waitingRooms}</span>
      <span>对局 ${e.playingRooms}</span>
      <span>狼队列 ${e.queueWolf}</span>
      <span>鹿队列 ${e.queueDeer}</span>
    `)}async function bt(){let[e,t,n,r,i,a,o,s]=await Promise.all([d().catch(()=>[]),ke().catch(()=>null),je().catch(()=>[]),Ne().catch(()=>null),Ie().catch(()=>[]),p().catch(()=>[]),f().catch(()=>F),Le().catch(()=>({count:T?.unreadNotifications??0}))]);k=e,A=t,j=n,M=r,N=i,P=a,F=o,T&&={...T,unreadNotifications:s.count}}function V(){return(T?.unreadNotifications??0)+F.received.length+P.reduce((e,t)=>e+t.unreadCount,0)}async function H(){let[e,t]=await Promise.all([Ie().catch(()=>N),Le().catch(()=>({count:T?.unreadNotifications??0}))]);N=e,T&&={...T,unreadNotifications:t.count}}function xt(e){let t=e.payload?.inviteCode;return typeof t==`string`||typeof t==`number`?String(t):``}function St(){try{let e=JSON.parse(window.localStorage.getItem(vt)??`[]`);return new Set(Array.isArray(e)?e.map(String):[])}catch{return new Set}}function Ct(e){if(!e)return;let t=St();t.add(e),window.localStorage.setItem(vt,JSON.stringify([...t].slice(-100)))}function wt(e){return St().has(e)}function U(){return C?(m(`你已在房间内，请先退出当前房间`),w=`room`,W(),!0):!1}function Tt(){document.querySelector(`.lobby-root`)?.addEventListener(`click`,e=>{e.target.closest(`button`)&&a.playSfx(`ui_click`)}),document.querySelector(`#local-game-btn`)?.addEventListener(`click`,()=>{U()||Pt(`AUTO`)}),document.querySelector(`#lobby-tab-btn`)?.addEventListener(`click`,()=>{w=`lobby`,W()}),document.querySelector(`#room-tab-btn`)?.addEventListener(`click`,()=>{if(!C){m(`请先加入房间`);return}w=`room`,W()}),document.querySelector(`#refresh-lobby-btn`)?.addEventListener(`click`,async()=>{await B(),W()}),document.querySelector(`#checkin-btn`)?.addEventListener(`click`,()=>Wt()),document.querySelector(`#activity-btn`)?.addEventListener(`click`,()=>Gt()),document.querySelector(`#guide-btn`)?.addEventListener(`click`,()=>Zt(!1)),document.querySelector(`#season-pass-btn`)?.addEventListener(`click`,()=>Kt()),document.querySelector(`#message-panel-btn`)?.addEventListener(`click`,()=>Y()),document.querySelector(`#add-friend-btn`)?.addEventListener(`click`,()=>void X()),document.querySelector(`#settings-btn`)?.addEventListener(`click`,()=>un()),document.querySelector(`#match-wolf-btn`)?.addEventListener(`click`,()=>{U()||Pt(`WOLF`)}),document.querySelector(`#match-deer-btn`)?.addEventListener(`click`,()=>{U()||Pt(`DEER`)}),document.querySelector(`#create-room-btn`)?.addEventListener(`click`,()=>{if(C){m(`你已在房间内，请先退出当前房间`),w=`room`,W();return}document.querySelector(`#create-room-dialog`)?.showModal()}),document.querySelector(`#join-room-code-btn`)?.addEventListener(`click`,async()=>{if(U())return;let e=window.prompt(`请输入房间号`);if(e)try{await q(await ae(e),`room`)}catch(e){m(e instanceof Error?e.message:`加入房间失败`)}}),document.querySelector(`#confirm-create-room`)?.addEventListener(`click`,async e=>{let t=e.currentTarget;if(C){m(`你已在房间内，请先退出当前房间`),document.querySelector(`#create-room-dialog`)?.close(),w=`room`,W();return}h(t,!0);try{let e=await re(document.querySelector(`#room-name-input`)?.value.trim()||`WildHunt 房间`);document.querySelector(`#create-room-dialog`)?.close(),await B(),await q(e,`room`)}catch(e){m(e instanceof Error?e.message:`创建房间失败`)}finally{h(t,!1)}}),document.addEventListener(`click`,async e=>{let t=e.target.closest(`.room-row`),n=t?.dataset.roomId;if(t&&n){if(C){U();return}try{await q(await ie(n),`room`)}catch(e){m(e instanceof Error?e.message:`加入房间失败`)}}}),document.addEventListener(`click`,async e=>{if(e.target.closest(`#leave-room-btn`)){if(!C)return;try{await se(C.id),a.playSfx(`room_leave`),C=null,E=[],D?.close(),D=null,w=`lobby`,await B(),W()}catch(e){m(e instanceof Error?e.message:`退出房间失败`)}}}),document.addEventListener(`contextmenu`,e=>{let t=e.target.closest(`.friend-item`);t&&(e.preventDefault(),pn(t.dataset.userId??``,t.dataset.name??`好友`))}),document.addEventListener(`click`,e=>{let t=e.target.closest(`.friend-more-btn`)?.closest(`.friend-item`);t&&pn(t.dataset.userId??``,t.dataset.name??`好友`)}),document.addEventListener(`click`,async e=>{let t=e.target.closest(`.add-room-friend-btn`);if(!(!t||!C))try{await be(String(C.id),t.dataset.userId??``),m(`好友申请已发送`),t.disabled=!0,t.textContent=`已申请`}catch(e){m(e instanceof Error?e.message:`好友申请失败`)}}),window.addEventListener(`wildhunt:toast`,e=>m(e.detail))}function W(){document.querySelector(`.lobby-root`)?.classList.toggle(`is-room-scene`,w===`room`&&!!C),Dt(),document.querySelector(`#lobby-tab-btn`)?.classList.toggle(`active`,w===`lobby`),document.querySelector(`#room-tab-btn`)?.classList.toggle(`active`,w===`room`);let e=document.querySelector(`#room-stay-badge`);e&&(e.textContent=C?C.roomCode:``,e.classList.toggle(`is-visible`,!!C));let t=document.querySelector(`#room-list`),n=document.querySelector(`#room-scene-view`),r=document.querySelector(`#room-waiting`),i=document.querySelector(`#invite-panel`),a=document.querySelector(`#leaderboard-panel`),o=document.querySelector(`.friend-list`),s=document.querySelector(`.friends-card-header small`),c=document.querySelector(`#message-count`),ee=document.querySelector(`#message-panel-btn`),te=document.querySelector(`.bottom-dock`),l=document.querySelector(`#local-game-btn`),u=!!C;te?.classList.toggle(`has-active-room`,u),document.querySelector(`.quick-match-card`)?.classList.toggle(`is-room-locked`,u),document.querySelectorAll(`#match-wolf-btn, #match-deer-btn, #create-room-btn, #join-room-code-btn`).forEach(e=>{e.disabled=u}),l&&(l.classList.toggle(`is-hidden`,u),l.disabled=u,l.setAttribute(`aria-hidden`,String(u))),t&&(t.innerHTML=We(b),t.querySelectorAll(`.join-room-btn`).forEach(e=>{e.disabled=u})),n&&(n.innerHTML=w===`room`?Ot(C):``),r&&(r.innerHTML=_n(C)),i&&(i.innerHTML=tt(C?.inviteLink??``)),o&&(o.outerHTML=At()),s&&(s.textContent=`（${k.length}）`),c&&(c.textContent=String(V())),ee?.classList.toggle(`has-dot`,V()>0),a&&(a.innerHTML=v(x,S),Et()),Nt()}function Et(){document.querySelectorAll(`[data-leaderboard-type]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.leaderboardType;if(!t||t===S)return;S=t;try{x=await he(S)}catch{x=[]}let n=document.querySelector(`#leaderboard-panel`);n&&(n.innerHTML=v(x,S),Et())})})}function Dt(){a.playBgm(w===`room`&&C?`room_loop`:`lobby_loop`)}function Ot(e){if(!e)return``;let t=e.members??[],n=G(e),r=!!n?.owner,i=r&&K(e),a=t.map(e=>{let t=String(e.userId)!==String(T?.userId)&&!kt(e.userId);return`
    <article class="room-player-slot ${e.owner?`owner`:``}">
      ${e.owner?`<span class="room-crown">房主</span>`:``}
      <span class="room-player-avatar icon-sprite ${e.roleType===`WOLF`?`icon-wolf`:`icon-deer`}"></span>
      <em>${e.ready?`已准备`:`未准备`}</em>
      <strong>${Q(e.nickname)}</strong>
      <small>${e.roleType===`WOLF`?`狼位待定`:`鹿位待定`}</small>
      ${t?`<button class="add-room-friend-btn" data-user-id="${e.userId}" type="button">加好友</button>`:``}
      ${r&&!e.owner?`<button class="kick-member-btn" data-user-id="${e.userId}" type="button">踢人</button>`:``}
    </article>
  `}),o=Array.from({length:Math.max(0,e.maxPlayers-t.length)},()=>`
      <article class="room-player-slot empty">
        <button class="invite-slot-btn" type="button" aria-label="邀请玩家">+</button>
        <strong>等待玩家加入</strong>
      </article>
    `),s=[...a,...o].join(``),c=E.length?E.map(e=>`
    <p class="${e.messageType===`SYSTEM`?`system`:``}">
      <span>${Z(e.createdAt)}</span>
      <b>${Q(e.nickname)}：</b>${Q(e.content)}
    </p>
  `).join(``):`<p class="system"><span>--:--</span><b>系统：</b>房间聊天已就绪</p>`;return`
    <div class="room-scene-main">
      <div class="room-scene-top">
        <button id="leave-room-btn" class="back-lobby-btn danger" type="button">退出房间</button>
        <div class="room-code-bar">
          <strong>房间号：${e.roomCode.replace(`#`,``)}</strong>
          <button id="copy-invite-btn" class="copy-room-btn" type="button" aria-label="复制房间号">⧉</button>
          <span></span>
          <b>经典模式 - ${Q(e.name)}</b>
        </div>
      </div>
      <section class="room-stage-card parchment-panel">
        <div class="room-slot-grid">${s}</div>
        <p class="room-start-tip">房主可在所有玩家准备后开始游戏；其他玩家准备后仍可在大厅浏览。</p>
        <div class="room-stage-actions">
          <button id="wechat-invite-btn" class="invite-friends-btn" type="button">邀请好友</button>
          ${r?`<button id="start-room-btn" class="room-start-btn" type="button" ${i?``:`disabled`}>开始游戏</button>`:`<button id="ready-btn" class="room-ready-btn ${n?.ready?`is-ready`:``}" type="button">${n?.ready?`取消准备`:`准备`}</button>`}
        </div>
      </section>
    </div>
    <aside class="room-scene-side">
      <section class="room-side-card parchment-panel">
        <h3>房间信息</h3>
        <dl>
          <dt>房间号</dt><dd>${e.roomCode.replace(`#`,``)}</dd>
          <dt>游戏模式</dt><dd>经典模式</dd>
          <dt>游戏地图</dt><dd>${Q(e.name)}</dd>
          <dt>玩家人数</dt><dd>${e.memberCount}/${e.maxPlayers}</dd>
          <dt>房主</dt><dd>${Q(t.find(e=>e.owner)?.nickname??`待定`)}</dd>
          <dt>AI 鹿</dt><dd>${e.aiDeerCount}</dd>
        </dl>
      </section>
      <section class="room-side-card parchment-panel chat">
        <h3>聊天区</h3>
        <div id="room-chat-list" class="room-chat-list">${c}</div>
        <form id="room-chat-form" class="room-chat-form">
          <input id="room-chat-input" maxlength="500" placeholder="输入聊天内容" />
          <button type="submit">发送</button>
        </form>
      </section>
    </aside>
  `}function G(e=C){let t=String(T?.userId??``);return!e||!t?null:e.members?.find(e=>String(e.userId)===t)??null}function K(e=C){return(e?.members??[]).filter(e=>!e.owner).every(e=>e.ready)}function kt(e){let t=String(e);return k.some(e=>String(e.userId)===t&&e.status===`ACCEPTED`)}function At(){return`
    <ul class="friend-list">
      ${(k.length?k.map((e,t)=>{let n=jt(e);return[t%3==0?`icon-wolf`:t%3==1?`icon-deer`:`icon-squirrel`,e.nickname,n.label,n.className,String(e.userId)]}):[[`icon-deer`,`暂无好友`,`可添加`,`offline`,``]]).map(([e,t,n,r,i])=>`
        <li class="friend-item" data-user-id="${i}" data-name="${Q(t)}" tabindex="0">
          <span class="friend-avatar icon-sprite ${e}" aria-hidden="true"></span>
          <strong>${t}</strong>
          <b class="${r}">${n}</b>
          <button class="friend-more-btn" type="button" aria-label="好友操作">⋯</button>
        </li>
      `).join(``)}
    </ul>
  `}function jt(e){return e.onlineState===`MATCHING`?{label:`匹配中`,className:`matching`}:e.onlineState===`IN_ROOM`?{label:`房间中`,className:`room`}:e.onlineState===`PLAYING`||e.inGame?{label:`游戏中`,className:`playing`}:e.onlineState===`OFFLINE`?{label:`离线`,className:`offline`}:{label:`在线`,className:`online`}}function Mt(e){let t=String(e);return k.find(e=>String(e.userId)===t)?.nickname??P.find(e=>String(e.friendUserId)===t)?.nickname??`好友`}function Nt(){document.querySelector(`#ready-btn`)?.addEventListener(`click`,async()=>{if(!C)return;let e=G(C);!e||e.owner||(C=await le(C.id,!e.ready),a.playSfx(`ready_toggle`),W())}),document.querySelectorAll(`#start-room-btn`).forEach(e=>e.addEventListener(`click`,async()=>{if(C){if(!K(C)){m(`还有玩家未准备`),W();return}try{let e=await ue(C.id);$(e.assignedRole===`WOLF`?`wolf`:`deer`,{userId:T?.userId,matchId:e.matchId,roomId:C.id,assignedRole:e.assignedRole,matchSeed:Number(e.matchId)})}catch(e){m(e instanceof Error?e.message:`开始游戏失败`)}}})),document.querySelector(`#copy-invite-btn`)?.addEventListener(`click`,async()=>Lt()),document.querySelector(`#wechat-invite-btn`)?.addEventListener(`click`,()=>dn()),document.querySelectorAll(`.invite-slot-btn`).forEach(e=>e.addEventListener(`click`,async()=>{await dn()})),document.querySelectorAll(`.kick-member-btn`).forEach(e=>e.addEventListener(`click`,async()=>{if(!C)return;let t=e.dataset.userId;if(t)try{await q(await ce(C.id,t,`房主移出`),`room`),m(`已移出该玩家`)}catch(e){m(e instanceof Error?e.message:`踢人失败`)}})),document.querySelector(`#room-chat-form`)?.addEventListener(`submit`,async e=>{if(e.preventDefault(),!C)return;let t=document.querySelector(`#room-chat-input`),n=t?.value.trim()??``;if(n)try{let e=await fe(C.id,n);E=[...E,e],t&&(t.value=``),W(),Ut()}catch(e){m(e instanceof Error?e.message:`发送失败`)}}),Ut()}async function Pt(e){if(U())return;let t=document.querySelector(`#match-status`),n=Date.now(),r=0,i=()=>{t&&(t.innerHTML=`匹配中 ${Ft(n)} <button id="cancel-match-btn" type="button">取消</button>`),document.querySelector(`#cancel-match-btn`)?.addEventListener(`click`,async()=>{window.clearInterval(r),await _e(),It(!1),t&&(t.textContent=`已取消匹配`)})};It(!0),i(),r=window.setInterval(i,1e3);try{let n=await ge(e);if(n.status===`MATCHED`&&n.assignedRole){window.clearInterval(r),a.playSfx(`match_found`),t&&(t.textContent=`匹配成功，正在进入对局...`),$(n.assignedRole===`WOLF`?`wolf`:`deer`,{userId:T?.userId,matchId:n.matchId,roomId:n.roomId,assignedRole:n.assignedRole,matchSeed:Number(n.matchId??Date.now())});return}i()}catch(e){window.clearInterval(r),m(e instanceof Error?e.message:`匹配失败`),It(!1),t&&(t.textContent=`匹配失败，请重试`)}}function Ft(e){let t=Math.max(0,Math.floor((Date.now()-e)/1e3));return`${Math.floor(t/60)}:${String(t%60).padStart(2,`0`)}`}function It(e){[`#match-wolf-btn`,`#match-deer-btn`,`#local-game-btn`].forEach(t=>{let n=document.querySelector(t);n&&(n.disabled=e||!!C)})}async function Lt(){let e=C?.inviteLink||`${window.location.origin}?invite=${C?.roomCode??``}`;await navigator.clipboard?.writeText(e),m(`邀请链接已复制`)}async function q(e,t=`room`){C=e,w=t,a.playSfx(`room_join`),await Rt(e.id),zt(e.id),W()}async function Rt(e){try{E=await de(e)}catch{E=[]}}function zt(e){D?.close(),D=He(e,t=>{if(t.type===`ROOM_CHAT_MESSAGE`&&`message`in t&&(E=[...E,t.message],W()),t.type===`ROOM_SNAPSHOT`&&`message`in t&&t.message&&(C=t.message,W()),t.type===`ROOM_KICKED`&&(C=null,E=[],w=`lobby`,m(`你已被房主移出房间`),W()),t.type===`ROOM_CLOSED`&&(C=null,E=[],w=`lobby`,m(`房间已关闭`),W()),t.type===`GAME_START`&&`message`in t&&t.message){let n=t.message;$(n.assignedRole===`WOLF`?`wolf`:`deer`,{userId:T?.userId,matchId:n.matchId,roomId:e,assignedRole:n.assignedRole,matchSeed:Number(n.matchId)})}})}function Bt(){O?.close(),O=Ue(async e=>{if(e.type===`FRIEND_ONLINE_CHANGED`&&e.message&&Vt(e.message),e.type===`FRIEND_CHAT_MESSAGE`&&e.message&&await Ht(e.message),e.type===`ROOM_INVITE_RECEIVED`&&(a.playSfx(`invite_received`),m(`收到新的房间邀请`),await H(),R?.open&&R.querySelector(`[data-message-panel="notice"].active`)&&Y(`notice`),W()),e.type===`FRIEND_REQUEST_RECEIVED`){a.playSfx(`notification`),F=await f().catch(()=>F);let t=e.message;m(t?.nickname?`收到 ${t.nickname} 的好友申请`:`收到新的好友申请`),R?.open&&R.querySelector(`[data-message-panel="notice"].active`)&&Y(`notice`),W()}if(e.type===`FRIEND_RELATION_UPDATED`){let t=e.message;k=await d().catch(()=>k),F=await f().catch(()=>F),P=await p().catch(()=>P),m(t?.nickname?`${t.nickname} 已成为好友`:`好友列表已更新`),R?.open&&R.querySelector(`[data-message-panel="notice"].active`)&&Y(`notice`),W()}})}function Vt(e){let t=String(e.userId??``);if(!t||!e.onlineState)return;let n=!1;k=k.map(r=>String(r.userId)===t?(n=!0,{...r,onlineState:e.onlineState,inGame:e.inGame??e.onlineState===`PLAYING`,roomId:e.roomId,matchId:e.matchId}):r),n&&W()}async function Ht(e){a.playSfx(`notification`),P=await p().catch(()=>P),I&&String(e.peerUserId)===I?(L=[...L,e],await Oe(I).catch(()=>void 0),rn(I,Mt(I)),on()):(m(`收到 ${e.senderNickname} 的消息`),W())}function Ut(){let e=document.querySelector(`#room-chat-list`);e&&(e.scrollTop=e.scrollHeight)}function J(e){R=document.querySelector(`#lobby-modal`),R&&(R.open&&R.close(),R.innerHTML=e,R.showModal(),R.querySelectorAll(`[data-close-modal]`).forEach(e=>e.addEventListener(`click`,()=>R?.close())))}function Wt(){let e=A?.rewards.map(e=>`
    <li class="${e.claimed?`claimed`:``}">
      <strong>第 ${e.day} 天</strong>
      <span>+${e.exp} EXP${e.assetCode?` · ${e.assetCode}`:``}</span>
    </li>
  `).join(``)??`<li><strong>签到加载中</strong><span>稍后重试</span></li>`;J(`
    <form method="dialog" class="modal-panel reward-panel">
      <header><h2>每日签到</h2><button data-close-modal type="button">×</button></header>
      <p>连续 ${A?.streakDays??0} 天 · 累计 ${A?.totalDays??0} 天</p>
      <ol class="reward-grid">${e}</ol>
      <button id="claim-checkin-btn" class="modal-primary" type="button" ${A?.claimedToday?`disabled`:``}>${A?.claimedToday?`今日已领取`:`领取今日奖励`}</button>
    </form>
  `),R?.querySelector(`#claim-checkin-btn`)?.addEventListener(`click`,async()=>{try{A=await Ae(),a.playSfx(`checkin_claim`),T=await y(()=>import(`./auth-api-_KeJNBLx.js`).then(e=>e.fetchMe()),__vite__mapDeps([0,1,2])).catch(()=>T),m(`签到奖励已领取`),R?.close(),z(T??void 0)}catch(e){m(e instanceof Error?e.message:`签到失败`)}})}function Gt(){J(`
    <form method="dialog" class="modal-panel activity-panel">
      <header><h2>活动中心</h2><button data-close-modal type="button">×</button></header>
      <div class="activity-list">${j.map(e=>`
    <article class="activity-row">
      <div>
        <strong>${Q(e.title)}</strong>
        <span>${Q(e.description)}</span>
        <small>${Q(e.condition)} · ${e.progress}/${e.target} · ${hn(e.reward)}</small>
      </div>
      <button class="claim-activity-btn" data-activity-id="${e.id}" type="button" ${e.claimable?``:`disabled`}>${qt(e)}</button>
    </article>
  `).join(``)||`<p>暂无活动</p>`}</div>
    </form>
  `),R?.querySelectorAll(`.claim-activity-btn`).forEach(e=>e.addEventListener(`click`,async()=>{try{await Me(e.dataset.activityId??``),a.playSfx(`activity_claim`),j=await je(),T=await y(()=>import(`./auth-api-_KeJNBLx.js`).then(e=>e.fetchMe()),__vite__mapDeps([0,1,2])).catch(()=>T),m(`活动奖励已到账`),R?.close(),z(T??void 0)}catch(e){m(e instanceof Error?e.message:`领取失败`)}}))}function Kt(){if(M){let e=M.expForNextLevel===0?`已达到本赛季满级`:`距离 ${M.level+1} 级还需 ${M.expForNextLevel-M.expIntoLevel} EXP`;J(`
      <form method="dialog" class="modal-panel season-panel">
        <header><h2>赛季通行证</h2><button data-close-modal type="button">×</button></header>
        <p>${Q(M.seasonName)} · 当前 ${M.level}/${M.maxLevel} 级 · ${M.expIntoLevel}/${M.expForNextLevel||`MAX`} EXP</p>
        <div class="season-progress"><i><b style="width: ${M.progressPercent}%"></b></i><span>${Q(e)}</span></div>
        <div class="season-tracks">${Jt(`免费奖励`,M.freeRewards)}${Jt(`高级奖励`,M.premiumRewards)}</div>
        ${M.premiumUnlocked?``:`<button id="unlock-season-premium-btn" class="modal-secondary" type="button">解锁高级奖励轨</button>`}
      </form>
    `),Xt();return}let e=[[`1`,`+100 EXP`],[`5`,`松林头像框`],[`10`,`追猎者称号`],[`15`,`+300 EXP`]],t=[[`1`,`月影狼头像`],[`5`,`月光头像框`],[`10`,`夜行猎手称号`],[`15`,`赛季专属动作`]],n=(e,t)=>`
    <section class="season-track">
      <h3>${e}</h3>
      ${t.map(([e,t])=>`<article><strong>${e}</strong><span>${t}</span></article>`).join(``)}
    </section>
  `;J(`
    <form method="dialog" class="modal-panel season-panel">
      <header><h2>赛季通行证</h2><button data-close-modal type="button">×</button></header>
      <p>S1 林间追猎 · 当前 15 级 · 820/1000</p>
      <div class="season-progress"><i><b style="width: 82%"></b></i><span>距离 16 级还需 180 EXP</span></div>
      <div class="season-tracks">${n(`免费奖励`,e)}${n(`高级奖励`,t)}</div>
    </form>
  `)}function qt(e){return e.claimed?`已领取`:e.expired?`已结束`:e.claimable?`领取`:`${e.progress}/${e.target}`}function Jt(e,t){return`
    <section class="season-track">
      <h3>${e}</h3>
      ${t.map(e=>`
        <article class="${e.claimed?`claimed`:``} ${e.claimable?`claimable`:``} ${e.locked?`locked`:``}">
          <strong>${e.level}</strong>
          <span>${Q(e.label)}</span>
          <button class="claim-season-reward-btn" data-track="${e.track}" data-level="${e.level}" type="button" ${e.claimable?``:`disabled`}>${Yt(e)}</button>
        </article>
      `).join(``)}
    </section>
  `}function Yt(e){return e.claimed?`已领取`:e.locked?`未解锁`:e.claimable?`领取`:`未达成`}function Xt(){R?.querySelectorAll(`.claim-season-reward-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{try{M=await Pe(e.dataset.track??`FREE`,Number(e.dataset.level??0)),T=await y(()=>import(`./auth-api-_KeJNBLx.js`).then(e=>e.fetchMe()),__vite__mapDeps([0,1,2])).catch(()=>T),m(`赛季奖励已领取`),R?.close(),z(T??void 0)}catch(e){m(e instanceof Error?e.message:`赛季奖励领取失败`)}})}),R?.querySelector(`#unlock-season-premium-btn`)?.addEventListener(`click`,async()=>{try{M=await Fe(),m(`高级奖励轨已解锁`),R?.close(),Kt()}catch(e){m(e instanceof Error?e.message:`高级奖励轨解锁失败`)}})}function Zt(e){J(`
    <form method="dialog" class="modal-panel guide-panel">
      <header><h2>新手指南</h2><button data-close-modal type="button">×</button></header>
      <div class="guide-tabs">
        <section><h3>狼方目标</h3><p>在倒计时内找出真人鹿。利用气味、观察移动习惯，避免误伤 AI 鹿。</p></section>
        <section><h3>鹿方目标</h3><p>混入 AI 鹿群，进食维持状态，环顾判断狼的位置，伪装躲开追猎。</p></section>
        <section><h3>房间与匹配</h3><p>玩家房间可邀请好友；系统匹配会按当前人数用 AI 补齐目标，不暴露真人等待状态。</p></section>
        <section><h3>奖杯规则</h3><p>胜利、快速完成目标、低可疑度表现会增加奖杯；中途退出会扣除奖杯。</p></section>
      </div>
      <button id="guide-seen-btn" class="modal-primary" type="button">我知道了</button>
    </form>
  `),R?.querySelector(`#guide-seen-btn`)?.addEventListener(`click`,async()=>{T=await Be().catch(()=>T),R?.close(),e||m(`新手指南已读`),W()})}function Qt(e){let t=$t(e);return`
    <article class="notification-row ${e.read?`read`:``} ${t?`actionable`:``}">
      <div>
        <strong>${Q(e.title)}</strong>
        <span>${Q(e.content)}</span>
        <small>${Q(e.type)} · ${Z(e.createdAt)}</small>
      </div>
      ${t}
    </article>
  `}function $t(e){if(e.type!==`ROOM_INVITE`)return``;let t=xt(e);return t?wt(t)?`
      <div class="notification-actions">
        <button type="button" disabled>已处理</button>
      </div>
    `:`
    <div class="notification-actions">
      <button class="accept-room-invite-btn" data-invite-code="${Q(t)}" data-notification-id="${Q(String(e.id))}" type="button">同意</button>
      <button class="reject-room-invite-btn" data-invite-code="${Q(t)}" data-notification-id="${Q(String(e.id))}" type="button">拒绝</button>
    </div>
  `:``}function Y(e=`notice`){I=null,L=[];let t=F.received.map(e=>{let t=ln(e.source),n=[e.username,t].filter(Boolean).join(` / `);return`
      <article class="friend-request-row friend-request-notice">
        <div>
          <strong>${Q(e.nickname)}</strong>
          <span>${Q(n||`好友申请`)}</span>
        </div>
        <div class="friend-request-actions">
          <button class="accept-friend-request-btn" data-user-id="${Q(String(e.requesterUserId??e.userId))}" type="button">接受</button>
          <button class="reject-friend-request-btn" data-user-id="${Q(String(e.requesterUserId??e.userId))}" type="button">拒绝</button>
        </div>
      </article>
    `}).join(``),n=N.map(Qt).join(``)||`<p class="muted">暂无通知</p>`,r=t&&N.length===0?t:`${t}${n}`,i=P.map(e=>`
    <article class="chat-conversation-row ${e.unreadCount>0?`unread`:``}" data-chat-user-id="${e.friendUserId}" data-chat-name="${Q(e.nickname)}">
      <div>
        <strong>${Q(e.nickname)}</strong>
        <span>${e.lastMessage?Q(e.lastMessage):`暂无消息`}</span>
      </div>
      <small>${e.unreadCount>0?`${e.unreadCount} 条未读`:Z(e.lastMessageAt??``)}</small>
      <button class="open-chat-btn" type="button">打开</button>
    </article>
  `).join(``)||`<p class="muted">暂无会话</p>`;J(`
    <form method="dialog" class="modal-panel notification-panel">
      <header><h2>消息中心</h2><button data-close-modal type="button">×</button></header>
      <div class="message-tabs" role="tablist">
        <button class="${e===`notice`?`active`:``}" data-message-tab="notice" type="button">通知</button>
        <button class="${e===`chat`?`active`:``}" data-message-tab="chat" type="button">聊天</button>
      </div>
      <section class="message-tab-panel ${e===`notice`?`active`:``}" data-message-panel="notice">
        <div class="notification-list">${r}</div>
        <button id="read-all-btn" class="modal-primary" type="button">全部已读</button>
      </section>
      <section class="message-tab-panel ${e===`chat`?`active`:``}" data-message-panel="chat">
        <div class="chat-conversation-list">${i}</div>
        <button id="refresh-chat-btn" class="modal-secondary" type="button">刷新聊天</button>
      </section>
    </form>
  `),en()}function en(){R?.querySelectorAll(`[data-message-tab]`).forEach(e=>{e.addEventListener(`click`,()=>Y(e.dataset.messageTab??`notice`))}),R?.querySelector(`#read-all-btn`)?.addEventListener(`click`,async()=>{await ze().catch(()=>void 0),N=N.map(e=>({...e,read:!0})),T&&={...T,unreadNotifications:0},m(`通知已全部标记为已读`),Y(`notice`),W()}),R?.querySelector(`#refresh-chat-btn`)?.addEventListener(`click`,async()=>{P=await p().catch(()=>P),Y(`chat`),W()}),R?.querySelectorAll(`.accept-room-invite-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{e.disabled=!0,await tn(e.dataset.inviteCode??``,`accept`,e.dataset.notificationId)})}),R?.querySelectorAll(`.reject-room-invite-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{e.disabled=!0,await tn(e.dataset.inviteCode??``,`reject`,e.dataset.notificationId)})}),R?.querySelectorAll(`.accept-friend-request-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{try{await xe(e.dataset.userId??``),k=await d().catch(()=>k),F=await f().catch(()=>F),P=await p().catch(()=>P),m(`已添加好友`),Y(`notice`),W()}catch(e){m(e instanceof Error?e.message:`接受申请失败`)}})}),R?.querySelectorAll(`.reject-friend-request-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{try{await Se(e.dataset.userId??``),F=await f().catch(()=>F),m(`已拒绝申请`),Y(`notice`),W()}catch(e){m(e instanceof Error?e.message:`拒绝申请失败`)}})}),R?.querySelectorAll(`.chat-conversation-row`).forEach(e=>{e.addEventListener(`click`,()=>{let t=e.dataset.chatUserId;t&&nn(t,e.dataset.chatName??Mt(t))})})}async function tn(e,t,n){if(!e){m(`邀请信息不完整`),Y(`notice`);return}try{if(t===`accept`){if(U())return;let t=await we(e);Ct(e),n&&await Re(n).catch(()=>void 0),await H(),R?.close(),await q(t.room,`room`),m(`已加入房间`);return}await Te(e),Ct(e),n&&await Re(n).catch(()=>void 0),await H(),m(`已拒绝房间邀请`),Y(`notice`),W()}catch(e){m(e instanceof Error?e.message:`处理房间邀请失败`),Y(`notice`)}}async function nn(e,t){let n=String(e);I=n,L=await Ee(n).catch(()=>[]),await Oe(n).catch(()=>void 0),P=await p().catch(()=>P),rn(n,t||Mt(n)),on(),W()}function rn(e,t){let n=String(e),r=L.map(e=>{let t=String(e.senderUserId)===String(T?.userId);return`
      <p class="friend-chat-message ${t?`mine`:`theirs`}">
        <strong>${Q(t?`我`:e.senderNickname)}</strong>
        <span>${Q(e.content)}</span>
        <small>${Z(e.createdAt)}</small>
      </p>
    `}).join(``)||`<p class="muted">还没有聊天记录</p>`;J(`
    <form method="dialog" class="modal-panel friend-chat-panel">
      <header>
        <button id="back-message-center-btn" type="button">‹</button>
        <h2>${Q(t)}</h2>
        <button data-close-modal type="button">×</button>
      </header>
      <div id="friend-chat-list" class="friend-chat-list">${r}</div>
      <div class="friend-chat-form">
        <input id="friend-chat-input" maxlength="500" placeholder="输入私聊内容" autocomplete="off" />
        <button id="send-friend-chat-btn" type="button">发送</button>
      </div>
    </form>
  `),R?.querySelector(`#back-message-center-btn`)?.addEventListener(`click`,()=>Y(`chat`)),R?.querySelector(`#send-friend-chat-btn`)?.addEventListener(`click`,async()=>an(n,t)),R?.querySelector(`#friend-chat-input`)?.addEventListener(`keydown`,async e=>{e.key===`Enter`&&(e.preventDefault(),await an(n,t))})}async function an(e,t){let n=R?.querySelector(`#friend-chat-input`),r=n?.value.trim()??``;if(r)try{let i=await De(e,r);L=[...L,i],P=await p().catch(()=>P),n&&(n.value=``),rn(e,t),on(),W()}catch(e){m(e instanceof Error?e.message:`私聊发送失败`)}}function on(){let e=R?.querySelector(`#friend-chat-list`);e&&(e.scrollTop=e.scrollHeight)}async function X(){F=await f().catch(()=>({received:[],sent:[]})),W(),J(sn(F,[])),cn(F)}function sn(e,t){let n=e.received.map(e=>`
    <article class="friend-request-row">
      <div>
        <strong>${Q(e.nickname)}</strong>
        <span>${Q(e.username??``)}${e.source?` · ${Q(e.source)}`:``}</span>
      </div>
      <div class="friend-request-actions">
        <button class="accept-friend-request-btn" data-user-id="${e.requesterUserId??e.userId}" type="button">接受</button>
        <button class="reject-friend-request-btn" data-user-id="${e.requesterUserId??e.userId}" type="button">拒绝</button>
      </div>
    </article>
  `).join(``)||`<p class="muted">暂无收到的申请</p>`,r=e.sent.map(e=>`
    <article class="friend-request-row muted-row">
      <div>
        <strong>${Q(e.nickname)}</strong>
        <span>等待对方通过</span>
      </div>
      <b>已发送</b>
    </article>
  `).join(``)||`<p class="muted">暂无发出的申请</p>`;return`
    <form method="dialog" class="modal-panel add-friend-panel">
      <header><h2>添加好友</h2><button data-close-modal type="button">×</button></header>
      <div class="friend-search-bar">
        <input id="friend-search-input" maxlength="64" placeholder="搜索账号或昵称" autocomplete="off" />
        <button id="friend-search-btn" type="button">搜索</button>
      </div>
      <section class="friend-request-list">
        <h3>搜索结果</h3>
        <div id="friend-search-results">${t.map(e=>{let t=e.status===`ACCEPTED`||e.status===`PENDING_SENT`,n=e.status===`ACCEPTED`?`已是好友`:e.status===`PENDING_SENT`?`已申请`:e.status===`PENDING_RECEIVED`?`去处理`:`申请`;return`
      <article class="friend-request-row">
        <div>
          <strong>${Q(e.nickname)}</strong>
          <span>${Q(e.username??``)}</span>
        </div>
        <button class="send-friend-request-btn" data-username="${Q(e.username??e.nickname)}" type="button" ${t?`disabled`:``}>${n}</button>
      </article>
    `}).join(``)||`<p class="muted">输入昵称或账号后搜索</p>`}</div>
      </section>
      <section class="friend-request-list">
        <h3>收到的申请</h3>
        ${n}
      </section>
      <section class="friend-request-list">
        <h3>发出的申请</h3>
        ${r}
      </section>
    </form>
  `}function cn(e){let t=async()=>{let t=R?.querySelector(`#friend-search-input`)?.value.trim()??``;J(sn(e,t?await ve(t).catch(e=>(m(e instanceof Error?e.message:`搜索失败`),[])):[])),cn(e);let n=R?.querySelector(`#friend-search-input`);n&&(n.value=t,n.focus())};R?.querySelector(`#friend-search-btn`)?.addEventListener(`click`,()=>void t()),R?.querySelector(`#friend-search-input`)?.addEventListener(`keydown`,e=>{e.key===`Enter`&&(e.preventDefault(),t())}),R?.querySelectorAll(`.send-friend-request-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{try{await ye(e.dataset.username??``),F=await f().catch(()=>F),m(`好友申请已发送`),X()}catch(e){m(e instanceof Error?e.message:`好友申请失败`)}})}),R?.querySelectorAll(`.accept-friend-request-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{try{await xe(e.dataset.userId??``),k=await d().catch(()=>k),F=await f().catch(()=>F),m(`已添加好友`),X(),W()}catch(e){m(e instanceof Error?e.message:`接受申请失败`)}})}),R?.querySelectorAll(`.reject-friend-request-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{try{await Se(e.dataset.userId??``),F=await f().catch(()=>F),m(`已拒绝申请`),W(),X()}catch(e){m(e instanceof Error?e.message:`拒绝申请失败`)}})})}function ln(e){return e===`ROOM`?`房间成员`:e===`SEARCH`?`搜索添加`:e??``}function un(){let e=JSON.parse(window.localStorage.getItem(`wildhunt.settings`)||`{}`),t=o();J(`
    <form method="dialog" class="modal-panel settings-panel">
      <header><h2>设置</h2><button data-close-modal type="button">×</button></header>
      <div class="settings-grid">
        <label>主音量<input id="setting-main-volume" type="range" min="0" max="100" value="${Math.round(t.mainVolume*100)}" /></label>
        <label>背景音乐<input id="setting-bgm-volume" type="range" min="0" max="100" value="${Math.round(t.bgmVolume*100)}" /></label>
        <label>音效音量<input id="setting-sfx-volume" type="range" min="0" max="100" value="${Math.round(t.sfxVolume*100)}" /></label>
        <label class="settings-check"><input id="setting-muted" type="checkbox" ${t.muted?`checked`:``} /> 静音</label>
      </div>
      <label>画质<select id="setting-quality"><option value="low">低</option><option value="medium">中</option><option value="high">高</option><option value="custom">自定义</option></select></label>
      <label>鼠标灵敏度<input id="setting-sensitivity" type="range" min="1" max="100" value="${e.sensitivity??`50`}" /></label>
      <label class="settings-check"><input id="setting-invert-camera" type="checkbox" ${e.invertCamera===`on`?`checked`:``} /> 镜头反转</label>
      <label>UI 缩放<input id="setting-ui-scale" type="range" min="80" max="120" value="${e.uiScale??`100`}" /></label>
      <label>字体大小<input id="setting-font-size" type="range" min="12" max="20" value="${e.fontSize??`16`}" /></label>
      <label>聊天字号<input id="setting-chat-font-size" type="range" min="12" max="20" value="${e.chatFontSize??`14`}" /></label>
      <label><input id="setting-tips" type="checkbox" ${e.tips===`off`?``:`checked`} /> 显示新手提示</label>
      <label><input id="setting-room-signal" type="checkbox" ${e.roomSignal===`off`?``:`checked`} /> 显示房间信号说明</label>
      <button id="save-settings-btn" class="modal-primary" type="button">保存设置</button>
      <button id="logout-btn" type="button">退出登录</button>
    </form>
  `);let n=R?.querySelector(`#setting-quality`);n&&(n.value=e.quality??`medium`);let r=()=>({mainVolume:gn(`#setting-main-volume`,70),bgmVolume:gn(`#setting-bgm-volume`,58),sfxVolume:gn(`#setting-sfx-volume`,78),muted:R?.querySelector(`#setting-muted`)?.checked??!1});[`#setting-main-volume`,`#setting-bgm-volume`,`#setting-sfx-volume`].forEach(e=>{R?.querySelector(e)?.addEventListener(`input`,()=>i(r()))}),R?.querySelector(`#setting-muted`)?.addEventListener(`change`,()=>i(r())),R?.querySelector(`#save-settings-btn`)?.addEventListener(`click`,()=>{let e=r();i(e);let t={volume:String(Math.round(e.mainVolume*100)),mainVolume:String(Math.round(e.mainVolume*100)),bgmVolume:String(Math.round(e.bgmVolume*100)),sfxVolume:String(Math.round(e.sfxVolume*100)),muted:e.muted?`on`:`off`,quality:R?.querySelector(`#setting-quality`)?.value??`medium`,sensitivity:R?.querySelector(`#setting-sensitivity`)?.value??`50`,invertCamera:R?.querySelector(`#setting-invert-camera`)?.checked?`on`:`off`,uiScale:R?.querySelector(`#setting-ui-scale`)?.value??`100`,fontSize:R?.querySelector(`#setting-font-size`)?.value??`16`,chatFontSize:R?.querySelector(`#setting-chat-font-size`)?.value??`14`,tips:R?.querySelector(`#setting-tips`)?.checked?`on`:`off`,roomSignal:R?.querySelector(`#setting-room-signal`)?.checked?`on`:`off`};window.localStorage.setItem(`wildhunt.settings`,JSON.stringify(t)),m(`设置已保存`),R?.close()}),R?.querySelector(`#logout-btn`)?.addEventListener(`click`,async()=>{try{C&&await se(C.id).catch(()=>void 0),D?.close(),O?.close(),await c(),window.sessionStorage.removeItem(_t),window.location.reload()}catch(e){m(e instanceof Error?e.message:`退出登录失败`)}})}async function dn(){if(!C){m(`请先进入房间再邀请好友`);return}let e=await fn();e&&(C=e,k=await d().catch(()=>k),J(`
    <form method="dialog" class="modal-panel room-invite-panel">
      <header><h2>邀请好友</h2><button data-close-modal type="button">×</button></header>
      <div class="room-friend-invite-list">${k.map(e=>{let t=jt(e);return`
      <article class="room-friend-invite-row">
        <div>
          <strong>${Q(e.nickname)}</strong>
          <span class="${t.className}">${t.label}</span>
        </div>
        <button class="invite-room-friend-btn" data-user-id="${e.userId}" type="button">邀请</button>
      </article>
    `}).join(``)||`<p class="muted">暂无可邀请好友</p>`}</div>
      <button id="copy-room-link-action" class="modal-secondary" type="button">复制房间链接</button>
    </form>
  `),R?.querySelector(`#copy-room-link-action`)?.addEventListener(`click`,async()=>{await Lt(),m(`邀请链接已复制`)}),R?.querySelectorAll(`.invite-room-friend-btn`).forEach(e=>{e.addEventListener(`click`,async()=>{try{await Ce(String(C.id),e.dataset.userId??``),m(`房间邀请已发送`)}catch(e){m(e instanceof Error?e.message:`邀请失败`)}})}))}async function fn(){let e=await oe().catch(()=>null);return!e||!C||String(e.id)!==String(C.id)?(C=e,w=e?`room`:`lobby`,W(),m(`请先进入当前房间再邀请好友`),null):e}function pn(e,t){if(!e){m(`好友资料暂不可用`);return}J(`
    <form method="dialog" class="modal-panel friend-menu-panel">
      <header><h2>${Q(t)}</h2><button data-close-modal type="button">×</button></header>
      <button id="chat-friend-action" class="modal-primary" type="button">发送消息</button>
      <button id="invite-friend-action" class="modal-secondary" type="button" ${C?``:`disabled`}>邀请加入房间</button>
      <button id="view-friend-profile-action" class="modal-secondary" type="button">查看资料</button>
    </form>
  `),R?.querySelector(`#chat-friend-action`)?.addEventListener(`click`,()=>{nn(e,t)}),R?.querySelector(`#view-friend-profile-action`)?.addEventListener(`click`,()=>{mn(e,t)}),R?.querySelector(`#invite-friend-action`)?.addEventListener(`click`,async()=>{if(!C){m(`请先进入房间再邀请好友`);return}try{let t=await fn();if(!t)return;await Ce(String(t.id),e),m(`房间邀请已发送`),R?.close()}catch(e){m(e instanceof Error?e.message:`邀请失败`)}})}async function mn(e,t){try{let n=await Ve(e),r=Number(n.totalMatches??0),i=Number(n.totalWins??0),a=r>0?`${Math.round(i/r*100)}%`:`0%`;J(`
      <form method="dialog" class="modal-panel friend-profile-panel">
        <header><h2>${Q(n.nickname||t)}</h2><button data-close-modal type="button">×</button></header>
        <section class="friend-profile-summary">
          <span class="friend-avatar icon-sprite icon-deer" aria-hidden="true"></span>
          <div>
            <strong>${Q(n.nickname||t)}</strong>
            <span>${Q(n.username??``)}</span>
            <small>Lv.${n.level??1} · ${Q(n.title??`新晋猎手`)}</small>
          </div>
        </section>
        <dl class="friend-profile-stats">
          <div><dt>奖杯</dt><dd>${n.trophies??0}</dd></div>
          <div><dt>评分</dt><dd>${n.rating??0}</dd></div>
          <div><dt>对局</dt><dd>${r}</dd></div>
          <div><dt>胜率</dt><dd>${a}</dd></div>
        </dl>
      </form>
    `)}catch(e){m(e instanceof Error?e.message:`查看资料失败`)}}function hn(e){let t=[];return typeof e.exp==`number`&&t.push(`+${e.exp} EXP`),typeof e.trophies==`number`&&t.push(`+${e.trophies} 奖杯`),typeof e.assetCode==`string`&&t.push(e.assetCode),t.join(` · `)||`奖励`}function gn(e,t){let n=Number(R?.querySelector(e)?.value??t);return Math.max(0,Math.min(1,n/100))}function Z(e){let t=new Date(e);return Number.isNaN(t.getTime())?`--:--`:`${t.getHours().toString().padStart(2,`0`)}:${t.getMinutes().toString().padStart(2,`0`)}`}function Q(e){return e.replace(/[&<>"']/g,e=>({"&":`&amp;`,"<":`&lt;`,">":`&gt;`,'"':`&quot;`,"'":`&#039;`})[e]??e)}function _n(e){if(!e)return``;let t=G(e),n=!!t?.owner,r=n&&K(e),i=e.members?.map(e=>`
    <li>
      <strong>${e.nickname}</strong>
      <span>${e.owner?`房主`:e.roleType} · ${e.ready?`已准备`:`未准备`}</span>
    </li>
  `).join(``)??``;return`
    <p class="section-label">房间 ${e.roomCode}</p>
    <h2>${e.name}</h2>
    <p class="muted">${e.memberCount}/${e.maxPlayers} 真人玩家 · AI 鹿 ${e.aiDeerCount}</p>
    <ul class="member-list">${i}</ul>
    <div class="room-actions">
      ${n?`<button id="start-room-btn" type="button" ${r?``:`disabled`}>开始游戏</button>`:`<button id="ready-btn" type="button">${t?.ready?`取消准备`:`准备`}</button>`}
    </div>
  `}async function $(e,t){a.stopBgm(300),g(`game`);let n=t??{userId:T?.userId,assignedRole:e===`wolf`?`WOLF`:`DEER`,matchSeed:Date.now()};window.sessionStorage.setItem(_t,JSON.stringify(n)),window.dispatchEvent(new CustomEvent(`wildhunt:game-start`,{detail:n})),window.__wildhuntGameOptions=n,await y(()=>import(`./game-scene-to4DleEc.js`),__vite__mapDeps([3,2,4]))}var vn=`/assets/bj-CAzA91mW.png`;async function yn(){if(!e())return null;try{return await ne()}catch(e){let t=e instanceof Error?e.message:``;return t.includes(`HTTP 401`)||t.includes(`HTTP 403`)?(n(),null):te()}}function bn(e){let t=document.querySelector(`#app`);if(!t)throw Error(`Missing #app root`);g(`login`),t.innerHTML=`
    <main class="login-root" style="--login-bg: url('${vn}')">
      <div id="toast-root"></div>
      <section class="login-panel" aria-labelledby="login-title">
        <img class="login-logo" src="${at}" alt="荒野追猎" />
        <p class="login-kicker">多人追猎对局</p>
        <h1 id="login-title">荒野追猎</h1>
        <p class="login-copy">进入大厅，创建房间、邀请好友，或直接匹配为狼与鹿。</p>
        <div class="login-tabs" role="tablist" aria-label="登录方式">
          <button id="login-mode-btn" class="active" type="button">登录</button>
          <button id="register-mode-btn" type="button">注册</button>
        </div>
        <form id="login-form" class="login-form">
          <label>
            <span>账号</span>
            <input id="login-username" name="username" autocomplete="username" placeholder="输入账号" />
          </label>
          <label>
            <span>密码</span>
            <input id="login-password" name="password" type="password" autocomplete="current-password" placeholder="至少 6 位" />
          </label>
          <label id="nickname-field" class="is-hidden">
            <span>昵称</span>
            <input id="login-nickname" name="nickname" autocomplete="nickname" placeholder="游戏内显示昵称" />
          </label>
          <button id="submit-login-btn" class="login-primary" type="submit">登录</button>
        </form>
        <div class="login-alt-actions">
          <button id="guest-login-btn" type="button">游客进入</button>
          <button id="wechat-login-btn" type="button">微信登录</button>
        </div>
      </section>
    </main>
  `,xn(e)}function xn(e){let t=`login`,n=document.querySelector(`#login-mode-btn`),r=document.querySelector(`#register-mode-btn`),i=document.querySelector(`#nickname-field`),a=document.querySelector(`#submit-login-btn`),o=e=>{t=e,n?.classList.toggle(`active`,t===`login`),r?.classList.toggle(`active`,t===`register`),i?.classList.toggle(`is-hidden`,t!==`register`),a&&(a.textContent=t===`login`?`登录`:`注册并进入`)};n?.addEventListener(`click`,()=>o(`login`)),r?.addEventListener(`click`,()=>o(`register`)),document.querySelector(`#wechat-login-btn`)?.addEventListener(`click`,()=>{m(`微信登录入口已预留，当前请先使用账号或游客进入`)}),document.querySelector(`#guest-login-btn`)?.addEventListener(`click`,async t=>{let n=t.currentTarget;await Sn(n,async()=>(await u()).user,e)}),document.querySelector(`#login-form`)?.addEventListener(`submit`,async n=>{n.preventDefault();let r=document.querySelector(`#login-username`)?.value.trim()??``,i=document.querySelector(`#login-password`)?.value??``,o=document.querySelector(`#login-nickname`)?.value.trim()??``;await Sn(a,async()=>t===`register`?(await l(r,i,o)).user:(await ee(r,i)).user,e)})}async function Sn(e,t,n){if(e){h(e,!0);try{n(await t())}catch(e){m(e instanceof Error?e.message:`登录失败`)}finally{h(e,!1)}}}var Cn=`wildhunt.match.options`,wn=await yn();wn?await Tn(wn)||z(wn):bn(e=>z(e));async function Tn(e){let t=await r().catch(()=>null),n=t?En(t,e):null;return n?(g(`game`),window.sessionStorage.setItem(Cn,JSON.stringify(n)),window.__wildhuntGameOptions=n,await y(()=>import(`./game-scene-to4DleEc.js`),__vite__mapDeps([3,2,4])),!0):!1}function En(e,t){let n=e.players.find(e=>!e.ai&&String(e.userId)===String(t.userId));return n?.roleType!==`WOLF`&&n?.roleType!==`DEER`?null:{userId:t.userId,matchId:e.matchId,roomId:e.roomId,assignedRole:n.roleType,matchSeed:e.matchSeed,gameConfig:e.gameConfig}}