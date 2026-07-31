(function(){
  "use strict";

  function patchKamakuraBuddha(){
    var posters=document.querySelectorAll('.tour-detail-poster[data-tour-poster-id="kamakura"]');
    for(var i=0;i<posters.length;i++){
      var card=posters[i].querySelector('.tour-motif-card[data-motif="buddha"]');
      if(!card)continue;
      card.style.setProperty('--motif-a','#3f6f62');
      card.style.setProperty('--motif-b','#8fc6ae');
      var icon=card.querySelector('.tour-motif-icon');
      var label=card.querySelector('.tour-motif-label');
      if(icon&&icon.textContent!=="🧘")icon.textContent="🧘";
      if(label&&label.textContent!=="БУДДА")label.textContent="БУДДА";
    }
  }

  function audit(){
    var catalog=window.SAMURAY_TOUR_CATALOG||{};
    var kamakura=catalog.kamakura;
    var issues=[];
    if(!kamakura)issues.push('kamakura missing');
    else if((kamakura.motifs||[]).indexOf('buddha')===-1)issues.push('kamakura buddha motif missing');
    window.SAMURAY_MOTIF_FIX_AUDIT={ok:issues.length===0,issues:issues};
    if(issues.length)console.error('SAMURAY_MOTIF_FIX_AUDIT',issues);
  }

  patchKamakuraBuddha();
  audit();
  new MutationObserver(patchKamakuraBuddha).observe(document.documentElement,{childList:true,subtree:true});
})();
