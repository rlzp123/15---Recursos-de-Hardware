
import { useState } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import './App.css';

const TOTAL_VAGAS = 14;

export default function App() {
  const [permissao, setPermissao] = useState('desconhecida');
  const [status, setStatus] = useState('App iniciado. Verifique a permissão.');
  const [logs, setLogs] = useState([]);
  const [confirmados, setConfirmados] = useState(8);
  const [euConfirmei, setEuConfirmei] = useState(false);
  const [pendentes, setPendentes] = useState(0);

  const faltam = TOTAL_VAGAS - confirmados;
  const percentual = Math.min(100, (confirmados / TOTAL_VAGAS) * 100);

  const registrar = (msg) => {
    const hora = new Date().toLocaleTimeString('pt-BR');
    setStatus(msg);
    setLogs((ant) => [`[${hora}] ${msg}`, ...ant].slice(0, 8));
  };

  const verificarPermissao = async () => {
    try {
      const r = await LocalNotifications.checkPermissions();
      setPermissao(r.display);
      registrar(`Permissão atual: ${r.display}`);
      return r.display;
    } catch (e) {
      registrar(`Erro: ${e.message}`);
      return 'erro';
    }
  };

  const solicitarPermissao = async () => {
    try {
      const r = await LocalNotifications.requestPermissions();
      setPermissao(r.display);
      registrar(
        r.display === 'granted'
          ? 'Permissão concedida!'
          : 'Permissão negada. Ative nas configurações.'
      );
      return r.display;
    } catch (e) {
      registrar(`Erro ao solicitar: ${e.message}`);
      return 'erro';
    }
  };

  const garantirPermissao = async () => {
    if ((await verificarPermissao()) === 'granted') return true;
    return (await solicitarPermissao()) === 'granted';
  };

  const notificacaoImediata = async () => {
    try {
      if (!(await garantirPermissao())) return;

      await LocalNotifications.schedule({
        notifications: [{
          title: 'PeladaClub FC',
          body: `⚽ ${confirmados} jogadores já confirmaram! Confirme sua presença no jogo de quinta às 20h!`,
          id: 311,
          schedule: {
            at: new Date(Date.now() + 1000),
            allowWhileIdle: true
          }
        }]
      });

      registrar('Notificação imediata agendada!');
    } catch (e) {
      registrar(`Erro: ${e.message}`);
    }
  };

  const notificacaoAgendada = async () => {
    try {
      if (!(await garantirPermissao())) return;

      await LocalNotifications.schedule({
        notifications: [{
          title: 'PeladaClub FC',
          body: `Confirme sua presença no jogo de quinta às 20h! Já são ${confirmados} confirmados.`,
          id: 310,
          schedule: {
            at: new Date(Date.now() + 10000),
            allowWhileIdle: true
          }
        }]
      });

      registrar('Notificação agendada para 10 segundos!');
      setTimeout(listarPendentes, 500);
    } catch (e) {
      registrar(`Erro: ${e.message}`);
    }
  };

  const confirmarPresenca = async () => {
    if (euConfirmei) {
      return registrar('Você já confirmou!');
    }

    if (confirmados >= TOTAL_VAGAS) {
      return registrar('Os times já estão completos!');
    }

    const novo = confirmados + 1;
    setConfirmados(novo);
    setEuConfirmei(true);

    registrar(`Você confirmou! Agora são ${novo} confirmados.`);

    try {
      if (!(await garantirPermissao())) return;

      await LocalNotifications.schedule({
        notifications: [{
          title: 'PeladaClub FC',
          body: `Presença confirmada! Agora são ${novo} de ${TOTAL_VAGAS} jogadores para quinta às 20h.`,
          id: 312,
          schedule: {
            at: new Date(Date.now() + 1000),
            allowWhileIdle: true
          }
        }]
      });
    } catch (e) {
      registrar(`Erro na notificação: ${e.message}`);
    }
  };

  const simularOutroJogador = () => {
    if (confirmados >= TOTAL_VAGAS) {
      return registrar('Os times já estão completos!');
    }

    const novo = confirmados + 1;
    setConfirmados(novo);
    registrar(`Outro jogador confirmou! Agora são ${novo}.`);
  };

  const listarPendentes = async () => {
    try {
      const { notifications } = await LocalNotifications.getPending();
      setPendentes(notifications.length);
      registrar(`${notifications.length} notificação(ões) pendente(s).`);
    } catch (e) {
      registrar(`Erro: ${e.message}`);
    }
  };

  const cancelarPendentes = async () => {
    try {
      const { notifications } = await LocalNotifications.getPending();

      if (!notifications.length) {
        return registrar('Nada pendente para cancelar.');
      }

      await LocalNotifications.cancel({
        notifications: notifications.map((n) => ({ id: n.id }))
      });

      setPendentes(0);
      registrar('Notificações pendentes canceladas!');
    } catch (e) {
      registrar(`Erro: ${e.message}`);
    }
  };

  return (
    <div className="container">
      <header className="cabecalho">
        <span className="bola">⚽</span>
        <h1>PeladaClub FC</h1>
        <p>Confirmação de presença da pelada da semana</p>
      </header>

      <section className="card">
        <h2>⚽ Jogo de Quinta-feira</h2>
        <p>🕗 Quinta-feira às 20h</p>
        <p>📍 Campo Society Central</p>

        <div className="numero-confirmados">
          <strong>{confirmados}</strong> / {TOTAL_VAGAS} confirmados
        </div>

        <div className="barra">
          <div
            className="barra-preenchida"
            style={{ width: `${percentual}%` }}
          />
        </div>

        <p>
          {faltam > 0
            ? `Faltam ${faltam} jogador(es) para completar os times!`
            : '🏆 Time completo!'}
        </p>

        {euConfirmei && (
          <p className="badge">Você confirmou presença!</p>
        )}
      </section>

      <section className="card">
        <p>🔐 Permissão: <strong>{permissao}</strong></p>
        <p>📌 Pendentes: <strong>{pendentes}</strong></p>

        <div className="botoes">
          <button onClick={verificarPermissao}>
            🔍 Verificar Permissão
          </button>

          <button onClick={solicitarPermissao}>
            🔔 Solicitar Permissão
          </button>

          <button className="destaque" onClick={notificacaoImediata}>
            ⚡ Notificação Imediata
          </button>

          <button className="destaque" onClick={notificacaoAgendada}>
            ⏰ Agendar em 10s
          </button>

          <button
            className="confirmar"
            onClick={confirmarPresenca}
            disabled={euConfirmei || confirmados >= TOTAL_VAGAS}
          >
            {euConfirmei
              ? '✅ Presença Confirmada'
              : '✅ Confirmar Minha Presença'}
          </button>

          <button onClick={simularOutroJogador}>
            👥 Simular +1 Confirmado
          </button>

          <button onClick={listarPendentes}>
            📌 Ver Pendentes
          </button>

          <button className="cancelar" onClick={cancelarPendentes}>
            🗑️ Cancelar Pendentes
          </button>
        </div>
      </section>

      <section className="card">
        <h3>📋 Status</h3>
        <p className="status-atual">{status}</p>

        {logs.map((log, i) => (
          <p key={i} className="log">{log}</p>
        ))}
      </section>
    </div>
  );
}
