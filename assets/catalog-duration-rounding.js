(function(){
  "use strict";

  var rounded = {
    "3d": "3 часа",
    "akiba": "3 часа",
    "family": "8 часов"
  };

  var fallbackBadges = {
    "3d": "Экспресс",
    "akiba": "Экспресс",
    "family": "Полный день"
  };

  function catalog(){
    return window.SAMURAY_TOUR_CATALOG || {};
  }

  function publicLabel(id){
    var data = catalog();
    var badge = data[id] && data[id].badge ? data[id].badge : fallbackBadges[id];
    return rounded[id] + (badge ? " • " + badge : "");
  }

  function applyData(){
    var data = catalog();
    Object.keys(rounded).forEach(function(id){
      if(!data[id]) return;
      data[id].duration = rounded[id];
      if(!data[id].badge && fallbackBadges[id]) data[id].badge = fallbackBadges[id];
    });
  }

  function cardId(card){
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
    grid.querySelectorAll(".card").forEach(function(card){
      var id = cardId(card);
      if(!rounded[id]) return;

      var meta = card.querySelector(".meta");
      if(!meta) return;

      var expected = publicLabel(id);
      var spans = meta.querySelectorAll("span");
      if(spans.length){
        if(spans[0].textContent !== expected) spans[0].textContent = expected;
        spans[0].style.display = "";
        for(var i = 1; i < spans.length; i++) spans[i].style.display = "none";
      }else if(meta.textContent.trim() !== expected){
        meta.textContent = expected;
      }
    });
  }

  function activeTourId(){
    var modal = document.getElementById("modalContent");
    var cover = modal && modal.querySelector("[data-tour-cover-id]");
    if(cover) return cover.getAttribute("data-tour-cover-id");
    return new URL(location.href).searchParams.get("tour");
  }

  function patchModal(){
    var id = activeTourId();
    if(!rounded[id]) return;
    var modal = document.getElementById("modalContent");
    if(!modal) return;
    var expected = publicLabel(id);
    modal.querySelectorAll(".info").forEach(function(info){
      var label = info.querySelector("small");
      var value = info.querySelector("b");
      if(label && value && label.textContent.trim() === "Длительность" && value.textContent !== expected){
        value.textContent = expected;
      }
    });
  }

  function patch(){
    applyData();
    patchCards();
    patchModal();
  }

  function schedule(){
    [0, 40, 120, 280].forEach(function(delay){
      setTimeout(patch, delay);
    });
  }

  addEventListener("click", schedule, true);
  addEventListener("popstate", schedule);

  var grid = document.getElementById("grid");
  var modal = document.getElementById("modalContent");
  if(grid) new MutationObserver(schedule).observe(grid, {childList:true, subtree:true});
  if(modal) new MutationObserver(schedule).observe(modal, {childList:true, subtree:true});

  patch();
  schedule();

  window.SAMURAY_DURATION_AUDIT = function(){
    var data = catalog();
    var issues = [];
    Object.keys(rounded).forEach(function(id){
      if(!data[id] || data[id].duration !== rounded[id] || publicLabel(id).indexOf(" • ") === -1) issues.push(id);
    });
    return {ok: issues.length === 0, count: Object.keys(rounded).length, issues: issues};
  };
})();
