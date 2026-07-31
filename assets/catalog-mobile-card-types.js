(function(){
  "use strict";

  var labels = {
    "3d": "3 часа • Экспресс",
    "akiba": "3 часа • Экспресс",
    "family": "8 часов • Полный день"
  };

  var timers = [];

  function getCardId(card){
    var id = card.getAttribute("data-tour-id") || card.getAttribute("data-catalog25-card");
    if(id) return id;

    var button = card.querySelector("[data-fallback-detail],[data-catalog25-detail],[onclick*='openTour'],[onclick*=\"openTour\"]");
    if(!button) return null;

    id = button.getAttribute("data-fallback-detail") || button.getAttribute("data-catalog25-detail");
    if(id) return id;

    var match = (button.getAttribute("onclick") || "").match(/openTour\(\s*['\"]([^'\"]+)['\"]\s*\)/);
    return match ? match[1] : null;
  }

  function patchCards(){
    var grid = document.getElementById("grid");
    if(!grid) return;

    var cards = grid.querySelectorAll(".card");
    for(var i = 0; i < cards.length; i++){
      var id = getCardId(cards[i]);
      var expected = labels[id];
      if(!expected) continue;

      var meta = cards[i].querySelector(".meta");
      if(!meta) continue;
      if(meta.textContent.trim() === expected && meta.children.length === 1) continue;

      meta.textContent = "";
      var span = document.createElement("span");
      span.textContent = expected;
      meta.appendChild(span);
    }
  }

  function schedule(){
    for(var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers = [0, 40, 120, 260].map(function(delay){
      return setTimeout(patchCards, delay);
    });
  }

  document.addEventListener("click", function(event){
    var target = event.target && event.target.closest ? event.target.closest("[data-fallback-filter], #filters .chip") : null;
    if(target) schedule();
  }, true);

  addEventListener("pageshow", schedule);
  addEventListener("popstate", schedule);
  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", schedule, {once:true});
  }

  schedule();

  window.SAMURAY_MOBILE_CARD_TYPE_AUDIT = function(){
    var issues = [];
    var grid = document.getElementById("grid");
    if(!grid) return {ok:false, issues:["grid missing"]};

    var cards = grid.querySelectorAll(".card");
    for(var i = 0; i < cards.length; i++){
      var id = getCardId(cards[i]);
      if(!labels[id]) continue;
      var meta = cards[i].querySelector(".meta");
      if(!meta || meta.textContent.trim() !== labels[id]) issues.push(id);
    }
    return {ok:issues.length === 0, issues:issues};
  };
})();
