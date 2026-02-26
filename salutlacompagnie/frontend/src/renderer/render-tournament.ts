import { shuffle, elFromHTML } from "../utils.js";
import { app, render } from "./renderer.js";
import { navigateTo, getHashPage } from "../router.js";
import { state } from "../state.js";
import { t } from "../lang/langIndex.js";

// joue un match entre p1 et p2, retourne une Promise qui résout sur le nom du gagnant
function playMatch(p1: string, p2: string, winningScore = state.WINNING_SCORE): Promise<string> {
  return new Promise((resolve) => {
    // clear area and render canvas
    app.innerHTML = '';
    const canvasHtml = `
      <div>
        <div class="mb-2 text-center text-sm text-[#9ca3af]">Match : <strong>${p1}</strong> vs <strong>${p2}</strong></div>
        <canvas id="pong-canvas" width="800" height="480" class="block mx-auto border border-slate-900"></canvas>
      </div>
    `;
    const wrap = document.createElement('div');
    wrap.className = 'bg-white rounded-lg shadow p-4';
    wrap.innerHTML = canvasHtml;
    app.appendChild(wrap);

    const GameClassLocal = (window as any).PongGame;
    if (!GameClassLocal) {
      alert(t(state.lang, "RenderTournament.GAME_MISSING"));
      resolve(p1); // fallback
      return;
    }

    // stop any previous instance
    if (state.currentGame && typeof state.currentGame.stop === 'function') {
      try { state.currentGame.stop(); } catch(e) { console.warn(e); }
      state.currentGame = null;
    }

    // create game with onGameOver callback
    state.currentGame = new GameClassLocal('pong-canvas', p1, p2, winningScore, (winner: string, loser: string) => {
      // ensure stop and resolve winner
      if (state.currentGame && typeof state.currentGame.stop === 'function') {
        try { state.currentGame.stop(); } catch(e) { console.warn(e); }
        state.currentGame = null;
      }
      resolve(winner);
    });
  });
}

export async function runTournament(initialPlayers: string[], winningScore = state.WINNING_SCORE) {
  if (!initialPlayers || initialPlayers.length < 2) {
    alert(t(state.lang, "RenderTournament.MIN_PLAYERS_ALERT"));
    return;
  }

  let roundPlayers = shuffle(initialPlayers);
  let round = 1;
  let tournamentAbort = false;

  while (roundPlayers.length > 1) {
    // display round header & abort button
    app.innerHTML = '';
    const headerEl = elFromHTML(`
      <div class="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <h3 class="text-lg font-medium">${t(state.lang, "RenderTournament.ROUND_HEADER", { round, players: roundPlayers.length })}</h3>
        <button id="abort-tournament" class="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 rounded text-sm">${t(state.lang, "RenderTournament.BACK")}</button>
      </div>
    `);
    app.appendChild(headerEl);

    // abort handler
    const abortBtn = document.getElementById('abort-tournament');
    if (abortBtn) {
      abortBtn.addEventListener('click', () => {
        tournamentAbort = true;
        // stop current game (if any)
        if (state.currentGame && typeof state.currentGame.stop === 'function') {
          try { state.currentGame.stop(); } catch (e) { console.warn(e); }
          state.currentGame = null;
        }
        navigateTo('home');
        render(getHashPage());
      });
    }

    const nextRound: string[] = [];
    // build matches for this round
    const matches: Array<{ p1: string; p2?: string }> = [];
    const byes: string[] = [];
    for (let i = 0; i < roundPlayers.length; i += 2) {
      const p1 = roundPlayers[i];
      const p2 = roundPlayers[i + 1];
      if (!p2) {
        byes.push(p1);
      } else {
        matches.push({ p1, p2 });
      }
    }

    // render overview of upcoming matches and byes
    app.innerHTML = '';
  const matchesHtml = matches.map(m => `<div class="py-1"><strong>${m.p1}</strong> - <strong>${m.p2}</strong></div>`).join('');
  const byesHtml = byes.length ? `<div class="mt-3 text-sm text-slate-500">${t(state.lang, "RenderTournament.ODD_PLAYERS", { players: byes.join(', ') })}</div>` : '';

    const overview = elFromHTML(`
      <div class="bg-white rounded-lg shadow px-6 py-6 text-center">
        <h2 class="text-xl font-semibold mb-3">${t(state.lang, "RenderTournament.ROUND_OVERVIEW", { round, matches: matches.length })}</h2>
        <div class="mb-4">${matchesHtml || t(state.lang, "RenderTournament.NO_MATCHES")}</div>
        ${byesHtml}
        <div class="flex justify-center gap-4 mt-4">
          <button id="start-round" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded">${t(state.lang, "RenderTournament.START_ROUND")}</button>
          <button id="abort-round" class="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 rounded text-sm">${t(state.lang, "RenderTournament.BACK_PREMATCH")}</button>
        </div>
      </div>
    `);
    app.appendChild(overview);

    // abort handler for overview
    overview.querySelector('#abort-round')?.addEventListener('click', () => {
      tournamentAbort = true;
      if (state.currentGame && typeof state.currentGame.stop === 'function') {
        try { state.currentGame.stop(); } catch (e) { console.warn(e); }
        state.currentGame = null;
      }
      navigateTo('home');
      render(getHashPage());
    });

    // wait for user to start the round
    await new Promise<void>((resolve) => {
      const btn = document.getElementById('start-round')!;
      btn.addEventListener('click', () => resolve());
    });

    // run through matches sequentially
    for (const m of matches) {
      if (tournamentAbort) break;

      const p1 = m.p1;
      const p2 = m.p2!;

      // play the match
      const winner = await playMatch(p1, p2, winningScore);

      if (tournamentAbort) break;

      // show victory and wait for next
      app.innerHTML = '';
      const victoryScreen = elFromHTML(`
        <div class="bg-white rounded-lg shadow px-6 py-10 text-center">
          <h2 class="text-2xl font-semibold mb-3">${t(state.lang, "RenderTournament.VICTORY")}<strong>${winner}</strong> !</h2>
          <p class="text-lg mb-6">(${p1} vs ${p2})</p>
          <button id="next-match" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded">${t(state.lang, "RenderTournament.NEXT_MATCH_BTN")}</button>
        </div>
      `);
      app.appendChild(victoryScreen);
      await new Promise<void>((resolve) => {
        const nextBtn = document.getElementById('next-match')!;
        nextBtn.addEventListener('click', () => resolve());
      });

      nextRound.push(winner);
    }

    // append byes automatically
    for (const b of byes) nextRound.push(b);

    if (tournamentAbort) return; // stop the tournament run

    // shuffle next round for fun (optional)
    roundPlayers = shuffle(nextRound);
    round++;
    // brief pause
    await new Promise((r) => setTimeout(r, 500));
  }

  // final winner
  const champion = roundPlayers[0];
  // show champion screen
  app.innerHTML = '';
  const champHtml = `
    <div class="bg-white rounded-lg shadow p-6 text-center">
      <h2 class="text-2xl font-semibold mb-4">${t(state.lang, "RenderTournament.CHAMPION_TITLE")}</h2>
      <p class="text-lg mb-4"><strong>${champion}</strong> ${t(state.lang, "RenderTournament.CHAMPION_MSG")}</p>
      <div class="flex justify-center gap-4 mt-4">
        <button id="to-home" class="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded">${t(state.lang, "RenderTournament.TO_HOME")}</button>
      </div>
    </div>
  `;
  app.appendChild(elFromHTML(champHtml));
  const toHomeBtn = document.getElementById('to-home');
  if (toHomeBtn) {
    toHomeBtn.addEventListener('click', () => {
      if (state.currentGame && typeof state.currentGame.stop === 'function') { try { state.currentGame.stop(); } catch(e){}}
      navigateTo('home');
      render(getHashPage());
    });
  }
}