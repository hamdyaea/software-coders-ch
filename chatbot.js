// Developer: Hamdy Abou El Anein
// Contact: info@software-coders.ch
// SPDX-License-Identifier: GPL-3.0-only
// Chat is optional: no network request is made until the visitor sends a message.
(() => {
  'use strict';
  const API = 'https://softwarecoders.pythonanywhere.com/chat';
  const CONTACT = 'info@software-coders.ch';
  const token = () => {
    // The original API validates a fresh timestamp; do not reuse an old token.
    return btoa(Math.floor(Date.now() / 1000) + ':software-coders');
  };
  // PythonAnywhere may need time to wake up after inactivity.
  const pause = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const ask = async (text, pending) => {
    const attempts = [40000, 50000, 60000];
    for (let index = 0; index < attempts.length; index++) {
      if (index > 0) {
        pending.textContent = 'Le serveur se réveille… Nouvelle tentative ' + (index + 1) + '/' + attempts.length + '. Merci de patienter.';
        await pause(index === 1 ? 2500 : 5000);
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), attempts[index]);
      try {
        const response = await fetch(API, {
          method: 'POST', mode: 'cors',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token() },
          body: JSON.stringify({ text }), signal: controller.signal
        });
        if (!response.ok) {
          const error = new Error('HTTP ' + response.status);
          error.retryable = [408, 429, 500, 502, 503, 504].includes(response.status);
          throw error;
        }
        const data = await response.json();
        if (!data || typeof data.response !== 'string' || !data.response.trim()) {
          const error = new Error('Empty response'); error.retryable = true; throw error;
        }
        return data.response;
      } catch (error) {
        console.warn('Chat attempt ' + (index + 1) + ' failed:', error);
        if (error.retryable === false || index === attempts.length - 1) throw error;
      } finally { clearTimeout(timeout); }
    }
  };
  const start = () => {
    if (document.getElementById('chatbot-container')) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
      <section id="chatbot-container" style="display:none" aria-label="Assistant Software-Coders">
        <div id="chatbot-header"><span>Assistant Software-Coders</span><button type="button" id="chatbot-toggle" aria-label="Fermer le chatbot">×</button></div>
        <div id="chatbot-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
        <form id="chatbot-input-container">
          <input id="chatbot-input" type="text" placeholder="Votre question…" aria-label="Votre question" maxlength="1000" required>
          <button id="chatbot-send" type="submit">Envoyer</button>
        </form>
      </section>
      <button type="button" id="chatbot-closed" style="display:block" aria-controls="chatbot-container" aria-expanded="false">Une question ?</button>`;
    document.body.appendChild(wrapper);
    const panel = document.getElementById('chatbot-container');
    const opener = document.getElementById('chatbot-closed');
    const closer = document.getElementById('chatbot-toggle');
    const form = document.getElementById('chatbot-input-container');
    const input = document.getElementById('chatbot-input');
    const send = document.getElementById('chatbot-send');
    const messages = document.getElementById('chatbot-messages');
    const show = (open) => {
      panel.style.display = open ? 'block' : 'none';
      opener.style.display = open ? 'none' : 'block';
      opener.setAttribute('aria-expanded', String(open));
      if (open) input.focus();
    };
    const append = (message, type) => {
      const div = document.createElement('div');
      div.className = 'chatbot-message ' + type;
      div.textContent = message;
      messages.appendChild(div);
      messages.scrollTop = messages.scrollHeight;
      return div;
    };
    opener.addEventListener('click', () => show(true));
    closer.addEventListener('click', () => show(false));
    append('Bonjour ! Je peux vous renseigner sur les formations et les services. Quel sujet vous intéresse ?', 'bot');
    let busy = false;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text || busy) return;
      input.value = '';
      append(text, 'user');
      busy = true;
      send.disabled = true;
      send.textContent = 'En cours…';
      const pending = append('Je recherche votre réponse… Le premier démarrage du serveur peut prendre une minute.', 'bot');
      try {
        if (/\brust\b/i.test(text)) {
          pending.textContent = 'Oui, Software-Coders propose des cours particuliers de Rust : ownership, borrowing, Cargo et programmation système. Tarif : 55 CHF/heure. Pour commencer, utilisez le formulaire de contact en choisissant « Rust ».';
          return;
        }
        pending.textContent = await ask(text, pending);
      } catch (error) {
        console.error('Chat API unavailable:', error);
        pending.textContent = 'Le service de chat ne répond pas actuellement. Vous pouvez envoyer votre demande via le formulaire de contact ou écrire à ' + CONTACT + '.';
      } finally {
        busy = false;
        send.disabled = false;
        send.textContent = 'Envoyer';
        messages.scrollTop = messages.scrollHeight;
      }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
