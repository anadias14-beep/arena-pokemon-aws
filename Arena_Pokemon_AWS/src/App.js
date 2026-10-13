import React, { useState, useEffect } from 'react';
import './App.css';

// URLs dos dois API Gateway (HTTP API). Ficam no arquivo .env
// (veja .env.example) e entram no código na hora do "npm run build".
const POKEMON_API_URL = process.env.REACT_APP_POKEMON_API_URL
  || 'https://dgu8gh4vkb.execute-api.us-east-1.amazonaws.com';
const BATALHAS_API_URL = process.env.REACT_APP_BATALHAS_API_URL || '';

// 1. Dicionário de Golpes para todos os 151 Pokémons
const POKEMON_MOVES = {
  1: ["Chicote de Cipó", "Folha Navalha", "Raio Solar"],
  2: ["Chicote de Cipó", "Folha Navalha", "Pó de Sono"],
  3: ["Raio Solar", "Planta Gema", "Terremoto"],
  4: ["Brasa", "Lança-Chamas", "Garra de Metal"],
  5: ["Lança-Chamas", "Fúria do Dragão", "Soco de Fogo"],
  6: ["Lança-Chamas", "Explosão de Fogo", "Asa de Aço"],
  7: ["Jato de Água", "Bolhas", "Quebra-Crânio"],
  8: ["Pistola de Água", "Giro Rápido", "Hidro Bomba"],
  9: ["Hidro Bomba", "Raio Congelante", "Terremoto"],
  10: ["Investida", "Tiro de Estilingue"],
  11: ["Endurecer"],
  12: ["Pó de Sono", "Ventania", "Psíquico"],
  13: ["Picada de Veneno", "Tiro de Estilingue"],
  14: ["Endurecer"],
  15: ["Ataque de Fúria", "Duplo Ataque", "Bomba de Lodo"],
  16: ["Investida", "Ataque de Areia", "Ventania"],
  17: ["Tornado", "Ataque de Asa", "Agilidade"],
  18: ["Ataque de Asa", "Furacão", "Ataque Rápido"],
  19: ["Investida", "Ataque Rápido", "Hiper Presa"],
  20: ["Hiper Presa", "Mastigar", "Super Presa"],
  21: ["Bicada", "Fúria", "Ataque de Asa"],
  22: ["Bico Broca", "Ataque de Asa", "Agilidade"],
  23: ["Picada de Veneno", "Mordida", "Ácido"],
  24: ["Picada Venenosa", "Mastigar", "Gunk Shot"],
  25: ["Choque do Trovão", "Ataque Rápido", "Trovoada"],
  26: ["Trovoada", "Choque do Trovão", "Hiper Raio"],
  27: ["Arranhão", "Ataque de Areia", "Magnitude"],
  28: ["Corte Furtivo", "Terremoto", "Rolo Compressor"],
  29: ["Picada de Veneno", "Arranhão", "Mordida"],
  30: ["Mordida Venenosa", "Investida", "Garra de Metal"],
  31: ["Poder da Terra", "Superpoder", "Veneno Choc"],
  32: ["Picada de Veneno", "Chute Duplo", "Bicada"],
  33: ["Chute Duplo", "Chifrada", "Fúria"],
  34: ["Terremoto", "Chifrada Broca", "Veneno Choc"],
  35: ["Tapa Duplo", "Metrônomo", "Voz Desarmante"],
  36: ["Metrônomo", "Brilho Mágico", "Força Psíquica"],
  37: ["Brasa", "Ataque de Areia", "Chama Espiral"],
  38: ["Lança-Chamas", "Fogo Fátuo", "Pulso Sombrio"],
  39: ["Canção de Ninar", "Tapa Duplo", "Voz Desarmante"],
  40: ["Hiper Voz", "Brilho Mágico", "Jogo Sujo"],
  41: ["Suga-Vidas", "Mordida", "Asa de Ataque"],
  42: ["Mordida Venenosa", "Cortador de Ar", "Presa de Veneno"],
  43: ["Absorver", "Pó de Sono", "Ácido"],
  44: ["Pó de Sono", "Dança de Pétalas", "Bomba de Lodo"],
  45: ["Dança de Pétalas", "Raio Solar", "Bomba de Lodo"],
  46: ["Arranhão", "Esporo", "Agulha Dupla"],
  47: ["Esporo", "Cortador de Xis", "Semente Sanguessuga"],
  48: ["Investida", "Pó de Sono", "Psíquico"],
  49: ["Zumbido de Inseto", "Psíquico", "Ventania de Prata"],
  50: ["Arranhão", "Lama Bomba", "Cavar"],
  51: ["Terremoto", "Cavar", "Desabamento"],
  52: ["Arranhão", "Dia do Pagamento", "Mordida"],
  53: ["Corte Furtivo", "Hiper Voz", "Jogo Sujo"],
  54: ["Pistola de Água", "Confusão", "Hidro Bomba"],
  55: ["Hidro Bomba", "Força Psíquica", "Surf"],
  56: ["Chute Baixo", "Golpe de Caratê", "Soco Focalizado"],
  57: ["Combate Próximo", "Soco Dinâmico", "Fúria"],
  58: ["Brasa", "Roda de Fogo", "Mastigar"],
  59: ["Superaquecimento", "Blitz de Fogo", "Mastigar"],
  60: ["Bolhas", "Pistola de Água", "Hipnose"],
  61: ["Tapa Duplo", "Jato de Água", "Hipnose"],
  62: ["Submissão", "Hidro Bomba", "Soco Dinâmico"],
  63: ["Teletransporte", "Investida", "Confusão"],
  64: ["Confusão", "Psicorrai", "Psíquico"],
  65: ["Psíquico", "Choque Psíquico", "Bola Sombria"],
  66: ["Golpe de Caratê", "Chute Baixo", "Soco Reto"],
  67: ["Submissão", "Golpe de Caratê", "Soco Dinâmico"],
  68: ["Combate Próximo", "Dynamic Punch", "Desabamento"],
  69: ["Chicote de Cipó", "Ácido", "Cortador de Folha"],
  70: ["Bomba de Lodo", "Cortador de Folha", "Pó de Sono"],
  71: ["Dança de Pétalas", "Folha Navalha", "Bomba de Lodo"],
  72: ["Ácido", "Pistola de Água", "Constrição"],
  73: ["Hidro Bomba", "Surf", "Onda de Veneno"],
  74: ["Lançamento de Rocha", "Magnitude", "Autodestruição"],
  75: ["Desabamento", "Terremoto", "Explosão"],
  76: ["Terremoto", "Borda de Pedra", "Explosão"],
  77: ["Brasa", "Roda de Fogo", "Pisoteio"],
  78: ["Blitz de Fogo", "Lança-Chamas", "Megachifre"],
  79: ["Pistola de Água", "Confusão", "Bocejo"],
  80: ["Surf", "Psíquico", "Raio Congelante"],
  81: ["Choque do Trovão", "Faísca", "Canhão de Luz"],
  82: ["Descarga", "Canhão de Luz", "Trovoada"],
  83: ["Corte", "Ataque de Asa", "Cortador de Fúria"],
  84: ["Bicada", "Ataque Rápido", "Fúria de Bicadas"],
  85: ["Bico Broca", "Tri-Ataque", "Agilidade"],
  86: ["Cabeçada", "Jato de Água", "Raio Aurora"],
  87: ["Raio Congelante", "Aqua Cauda", "Nevasca"],
  88: ["Bomba de Lodo", "Lodo", "Minimizar"],
  89: ["Onda de Veneno", "Soco de Lodo", "Gunk Shot"],
  90: ["Aperto", "Estalactite", "Retirada"],
  91: ["Canhão de Espinhos", "Hidro Bomba", "Raio Congelante"],
  92: ["Lamber", "Hipnose", "Bola Sombria"],
  93: ["Soco Sombrio", "Pulso Sombrio", "Comer Sonhos"],
  94: ["Bola Sombria", "Bomba de Lodo", "Clarão Ofuscante"],
  95: ["Lançamento de Rocha", "Tumba de Rocha", "Cavar"],
  96: ["Libra", "Hipnose", "Confusão"],
  97: ["Psíquico", "Comer Sonhos", "Soco Psíquico"],
  98: ["Bolhas", "Martelo de Caranguejo", "Guillotina"],
  99: ["Martelo de Caranguejo", "Guillotina", "Surf"],
  100: ["Choque do Trovão", "Faísca", "Autodestruição"],
  101: ["Descarga", "Trovoada", "Explosão"],
  102: ["Confusão", "Semente Sanguessuga", "Bomba de Ovo"],
  103: ["Psíquico", "Raio Solar", "Confusão"],
  104: ["Bumerangue de Osso", "Cabeçada", "Ataque de Osso"],
  105: ["Bumerangue de Osso", "Terremoto", "Borda de Pedra"],
  106: ["Chute Voador Duplo", "Mega Chute", "Combate Próximo"],
  107: ["Soco de Fogo", "Soco de Gelo", "Soco do Trovão"],
  108: ["Lamber", "Pisoteio", "Hiper Voz"],
  109: ["Smog", "Resíduo", "Auto-Destruição"],
  110: ["Onda de Veneno", "Explosão", "Lança-Chamas"],
  111: ["Chifrada", "Pisoteio", "Terremoto"],
  112: ["Chifrada Broca", "Terremoto", "Borda de Pedra"],
  113: ["Tapa Duplo", "Ovo Bomba", "Canto"],
  114: ["Chicote de Cipó", "Mega Dreno", "Poder da Natureza"],
  115: ["Soco Cometa", "Quebra-Crânio", "Ultraje"],
  116: ["Bolhas", "Pistola de Água", "Pulso de Dragão"],
  117: ["Pistola de Água", "Hidro Bomba", "Pulso de Dragão"],
  118: ["Picada", "Pulso de Água", "Chifrada Broca"],
  119: ["Chifrada Broca", "Cachoeira", "Aqua Cauda"],
  120: ["Investida", "Pistola de Água", "Raio de Bolhas"],
  121: ["Hidro Bomba", "Psíquico", "Raio Congelante"],
  122: ["Confusão", "Barreira", "Psíquico"],
  123: ["Corte Furtivo", "Ataque de Asa", "Cortador de Xis"],
  124: ["Soco de Gelo", "Psíquico", "Beijo Doce"],
  125: ["Soco do Trovão", "Descarga", "Trovoada"],
  126: ["Soco de Fogo", "Lança-Chamas", "Explosão de Fogo"],
  127: ["Submissão", "Tesoura Xis", "Guilhotina"],
  128: ["Chifrada", "Pisoteio", "Hiper Raio"],
  129: ["Salpicar", "Investida"],
  130: ["Hidro Bomba", "Dança do Dragão", "Ultraje"],
  131: ["Surf", "Raio Congelante", "Hidro Bomba"],
  132: ["Transformação", "Investida"],
  133: ["Investida", "Ataque Rápido", "Mordida"],
  134: ["Pistola de Água", "Hidro Bomba", "Raio Aurora"],
  135: ["Choque do Trovão", "Descarga", "Alfinetada"],
  136: ["Brasa", "Presa de Fogo", "Lança-Chamas"],
  137: ["Investida", "Psicorrai", "Tri-Ataque"],
  138: ["Pistola de Água", "Desabamento", "Poder Antigo"],
  139: ["Hidro Bomba", "Poder Antigo", "Borda de Pedra"],
  140: ["Arranhão", "Absorver", "Jato de Água"],
  141: ["Corte Furtivo", "Aqua Cauda", "Borda de Pedra"],
  142: ["Asa de Ataque", "Desabamento", "Hiper Raio"],
  143: ["Cabeçada", "Corpo a Corpo", "Hiper Raio"],
  144: ["Raio Congelante", "Ventania", "Nevasca"],
  145: ["Choque do Trovão", "Bico Broca", "Trovoada"],
  146: ["Lança-Chamas", "Ataque de Asa", "Explosão de Fogo"],
  147: ["Envolver", "Tornado", "Pulso de Dragão"],
  148: ["Tornado", "Aqua Cauda", "Fúria do Dragão"],
  149: ["Fúria do Dragão", "Soco do Trovão", "Hiper Raio"],
  150: ["Confusão", "Psíquico", "Bola Sombria"],
  151: ["Libra", "Psíquico", "Metrônomo"]
};

// 2. Configurações e Tipos das Arenas com Pontuação Mínima Necessária
const ARENAS = {
  ginasio: { name: 'Estádio Pokémon', types: ['todos'], bg: '#E0F7FA', reqPontos: 0 },
  floresta: { name: 'Floresta Viridian', types: ['grass', 'bug'], bg: '#C8E6C9', reqPontos: 1000 },
  vulcao: { name: 'Vulcão de Cinnabar', types: ['fire'], bg: '#FFCDD2', reqPontos: 2000 },
  oceano: { name: 'Ilhas de Espuma (Oceano)', types: ['water'], bg: '#BBDEFB', reqPontos: 3000 },
  usina: { name: 'Usina Elétrica Abandonada', types: ['electric'], bg: '#FFF9C4', reqPontos: 4000 },
  caverna: { name: 'Caverna dos Diglett', types: ['rock', 'ground', 'ghost'], bg: '#D7CCC8', reqPontos: 5000 },
  torre: { name: 'Torre de Lavander (Psíquico)', types: ['psychic'], bg: '#E1BEE7', reqPontos: 6000 }
};

const getAtaquesDoPokemon = (pokemon) => {
  const id = Number(pokemon.pokemonId);
  const nomesAtaques = POKEMON_MOVES[id] || ["Investida", "Ataque Rápido", "Ataque Especial"];
  const multiplicadores = [0.4, 0.65, 0.9];

  return nomesAtaques.map((nome, index) => ({
    name: nome,
    mult: multiplicadores[index] || 0.5
  }));
};

function App() {
  const [pokemons, setPokemons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados do Jogador e Ranking AWS
  const [nickname, setNickname] = useState('');
  const [vitorias, setVitorias] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [ranking, setRanking] = useState([]);

  // Estados Locais
  const [meuTime, setMeuTime] = useState([]);
  const [arena, setArena] = useState('ginasio');

  // Estados da Batalha
  const [tela, setTela] = useState('selecao'); // 'selecao', 'batalha', 'fim'
  const [timeRival, setTimeRival] = useState([]);
  const [idxJogador, setIdxJogador] = useState(0);
  const [idxRival, setIdxRival] = useState(0);
  const [turno, setTurno] = useState('jogador');
  const [log, setLog] = useState([]);
  const [mensagemFim, setMensagemFim] = useState('');

  const [erroApi, setErroApi] = useState('');

  // 1. Busca os Pokémons da AWS (API Gateway -> Lambda GetPokemonData -> DynamoDB)
  useEffect(() => {
    fetch(`${POKEMON_API_URL}/pokemons`)
      .then((res) => {
        if (!res.ok) throw new Error(`API respondeu ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPokemons(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar dados:', err);
        setErroApi('Não foi possível carregar os Pokémons. Tente recarregar a página.');
        setLoading(false);
      });
  }, []);

  // 2. Busca o Ranking da AWS (API Gateway -> Lambda SalvarResultadoBatalha -> DynamoDB)
  const buscarRanking = async () => {
    if (!BATALHAS_API_URL) return;
    try {
      const response = await fetch(`${BATALHAS_API_URL}/ranking`);
      const data = await response.json();
      if (Array.isArray(data)) setRanking(data);
    } catch (err) {
      console.error("Erro ao carregar ranking:", err);
    }
  };

  useEffect(() => {
    buscarRanking();
  }, []);

  // 3. Registra a partida no Backend. Quem calcula os pontos é a Lambda;
  //    a página só mostra o valor que o servidor devolve.
  const guardarPontuacao = async (resultado) => {
    if (!BATALHAS_API_URL) return;
    try {
      const response = await fetch(`${BATALHAS_API_URL}/batalhas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: nickname.trim(),
          arena,
          resultado,
          time: meuTime.map((p) => String(p.pokemonId))
        })
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("API recusou a partida:", data);
        return;
      }
      setPontos(Number(data.jogador.pontuacao));
      setVitorias(Number(data.jogador.vitorias));
      buscarRanking();
    } catch (err) {
      console.error("Erro ao guardar pontos na API:", err);
    }
  };

  // Filtra Pokémons elegíveis para a Arena Escolhida
  const pokemonsFiltrados = pokemons.filter((p) => {
    const tiposPermitidos = ARENAS[arena].types;
    if (tiposPermitidos.includes('todos')) return true;

    const tipoP1 = p.type1 ? p.type1.toLowerCase() : '';
    const tipoP2 = p.type2 ? p.type2.toLowerCase() : '';

    return tiposPermitidos.includes(tipoP1) || tiposPermitidos.includes(tipoP2);
  });

  const escolherPokemon = (pokemon) => {
    if (meuTime.length < 3 && !meuTime.some((p) => p.pokemonId === pokemon.pokemonId)) {
      setMeuTime([...meuTime, pokemon]);
    }
  };

  const removerPokemon = (pokemonId) => {
    setMeuTime(meuTime.filter((p) => p.pokemonId !== pokemonId));
  };

  const handleTrocaArena = (chaveArena) => {
    const req = ARENAS[chaveArena].reqPontos;
    if (pontos < req) {
      alert(`Você precisa de pelo menos ${req} pontos para acessar a arena: ${ARENAS[chaveArena].name}!`);
      return;
    }
    setArena(chaveArena);
    setMeuTime([]);
  };

  // Inicia a Batalha
  const iniciarBatalha = () => {
    if (!nickname.trim()) {
      alert("Por favor, digite o seu Nickname antes de iniciar a batalha!");
      return;
    }
    // mesma regra que a Lambda aplica (validação nos dois lados)
    if (!/^[\p{L}\p{N} _-]{2,20}$/u.test(nickname.trim())) {
      alert("O Nickname deve ter de 2 a 20 caracteres: letras, números, espaço, _ ou -.");
      return;
    }

    const timeJ = meuTime.map((p) => ({ ...p, hpAtual: p.hp * 2, hpMax: p.hp * 2 }));
    const candidatosRival = pokemonsFiltrados.length >= 3 ? pokemonsFiltrados : pokemons;
    const embaralhado = [...candidatosRival].sort(() => 0.5 - Math.random());
    const timeR = embaralhado.slice(0, 3).map((p) => ({ ...p, hpAtual: p.hp * 2, hpMax: p.hp * 2 }));

    setMeuTime(timeJ);
    setTimeRival(timeR);
    setIdxJogador(0);
    setIdxRival(0);
    setTurno('jogador');
    setLog([`Batalha iniciada na arena ${ARENAS[arena].name}! Vai, ${timeJ[0].name}!`]);
    setTela('batalha');
  };

  // Jogador Ataca
  const ataqueJogador = (golpe) => {
    if (turno !== 'jogador') return;

    let novoTimeRival = [...timeRival];
    let pJogador = meuTime[idxJogador];
    let pRival = novoTimeRival[idxRival];

    let variacao = Math.random() * 0.2 + 0.9;
    let dano = Math.max(1, Math.floor(pJogador.attack * golpe.mult * variacao));

    pRival.hpAtual -= dano;
    if (pRival.hpAtual < 0) pRival.hpAtual = 0;

    let novoLog = [`Seu ${pJogador.name} usou "${golpe.name}" e causou ${dano} de dano!`, ...log];

    if (pRival.hpAtual === 0) {
      novoLog.unshift(`O ${pRival.name} inimigo desmaiou!`);
      if (idxRival + 1 < 3) {
        setIdxRival(idxRival + 1);
        novoLog.unshift(`O oponente enviou ${novoTimeRival[idxRival + 1].name}!`);
        setTurno('jogador');
      } else {
        const novosPontos = pontos + 100;
        const novasVitorias = vitorias + 1;
        setPontos(novosPontos);
        setVitorias(novasVitorias);

        // Verifica se atingiu a marca de 1000 pontos
        if (novosPontos >= 1000 && pontos < 1000) {
          setMensagemFim('🎉 PARABÉNS! Você alcançou 1000 pontos e desbloqueou a Floresta Viridian!');
        } else {
          setMensagemFim('🏆 VOCÊ VENCEU! (+100 Pontos)');
        }

        setTela('fim');
        guardarPontuacao('vitoria');
      }
    } else {
      setTurno('rival');
    }

    setTimeRival(novoTimeRival);
    setLog(novoLog);
  };

  // Turno da IA
  useEffect(() => {
    if (tela === 'batalha' && turno === 'rival') {
      const timer = setTimeout(() => {
        let novoMeuTime = [...meuTime];
        let pRival = timeRival[idxRival];
        let pJogador = novoMeuTime[idxJogador];

        const golpesRival = getAtaquesDoPokemon(pRival);
        const golpeSorteado = golpesRival[Math.floor(Math.random() * golpesRival.length)];

        let dano = Math.max(1, Math.floor(pRival.attack * golpeSorteado.mult * 0.8));
        pJogador.hpAtual -= dano;
        if (pJogador.hpAtual < 0) pJogador.hpAtual = 0;

        let novoLog = [`O ${pRival.name} inimigo usou "${golpeSorteado.name}" e causou ${dano} de dano!`, ...log];

        if (pJogador.hpAtual === 0) {
          novoLog.unshift(`Seu ${pJogador.name} desmaiou!`);
          if (idxJogador + 1 < 3) {
            setIdxJogador(idxJogador + 1);
            novoLog.unshift(`Vai, ${novoMeuTime[idxJogador + 1].name}!`);
            setTurno('jogador');
          } else {
            const novosPontos = Math.max(0, pontos - 50);
            setPontos(novosPontos);
            setMensagemFim('💀 VOCÊ PERDEU! (-50 Pontos)');
            setTela('fim');
            guardarPontuacao('derrota');
          }
        } else {
          setTurno('jogador');
        }

        setMeuTime(novoMeuTime);
        setLog(novoLog);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [turno, tela, idxJogador, idxRival, meuTime, timeRival, log, pontos, vitorias]);

  const reiniciar = () => {
    setMeuTime([]);
    setTimeRival([]);
    setLog([]);
    setTela('selecao');
  };

  // --- TELA DE FIM ---
  if (tela === 'fim') {
    return (
      <div style={{ backgroundColor: ARENAS[arena].bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <h1 style={{ fontSize: '36px', color: mensagemFim.includes('VENCEU') || mensagemFim.includes('PARABÉNS') ? '#2e7d32' : '#c62828', textAlign: 'center' }}>{mensagemFim}</h1>
        <h2>Treinador: {nickname || 'Anónimo'}</h2>
        <h2>Pontuação Atual: ⭐ {pontos} | Vitórias: 🏆 {vitorias}</h2>

        <button onClick={reiniciar} style={{ marginTop: '20px', padding: '15px 30px', fontSize: '18px', backgroundColor: '#1976D2', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          Voltar para Seleção
        </button>

        <div style={{ marginTop: '40px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', width: '100%', maxWidth: '600px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
          <h2 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>🏆 Leaderboard Global</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#333', color: '#fff' }}>
                <th style={{ padding: '8px' }}>#</th>
                <th style={{ padding: '8px' }}>Treinador</th>
                <th style={{ padding: '8px' }}>Vitórias</th>
                <th style={{ padding: '8px' }}>Pontos</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd', textAlign: 'center' }}>
                  <td style={{ padding: '8px' }}>{index + 1}º</td>
                  <td style={{ padding: '8px', fontWeight: 'bold' }}>{item.nickname}</td>
                  <td style={{ padding: '8px' }}>{item.vitorias || 0}</td>
                  <td style={{ padding: '8px', color: '#1976D2', fontWeight: 'bold' }}>{item.pontuacao || 0} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- TELA DE BATALHA ---
  if (tela === 'batalha') {
    const pJogador = meuTime[idxJogador];
    const pRival = timeRival[idxRival];
    const ataquesAtuais = getAtaquesDoPokemon(pJogador);

    return (
      <div style={{ backgroundColor: ARENAS[arena].bg, minHeight: '100vh', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Arena: {ARENAS[arena].name}</h2>
          <h2 style={{ color: '#d81b60' }}>⭐ Pontos: {pontos}</h2>
        </div>

        <h3 style={{ textAlign: 'center', margin: '10px 0' }}>
          {turno === 'jogador' ? '🟢 Sua vez de atacar!' : '🔴 Oponente pensando...'}
        </h3>

        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginTop: '20px' }}>
          {/* Jogador (Sprite de Costas) */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '12px', width: '40%', textAlign: 'center', border: turno === 'jogador' ? '4px solid #4CAF50' : '1px solid #ccc' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Seu time ({3 - idxJogador} restantes)</span>
            <br />
            <img 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${pJogador.pokemonId}.png`} 
              alt={pJogador.name} 
              style={{ width: '150px' }} 
            />
            <h2 style={{ margin: '5px 0' }}>{pJogador.name}</h2>

            <div style={{ backgroundColor: '#e0e0e0', borderRadius: '10px', height: '18px', width: '100%', margin: '10px 0 5px 0' }}>
              <div style={{ backgroundColor: pJogador.hpAtual > pJogador.hpMax / 4 ? '#4CAF50' : '#f44336', height: '18px', borderRadius: '10px', width: `${(pJogador.hpAtual / pJogador.hpMax) * 100}%`, transition: 'width 0.4s' }}></div>
            </div>
            <p style={{ margin: 0 }}><strong>HP:</strong> {pJogador.hpAtual} / {pJogador.hpMax}</p>
            <p><strong>Ataque Base:</strong> {pJogador.attack}</p>

            <h4 style={{ margin: '15px 0 8px 0' }}>Escolha um Ataque:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ataquesAtuais.map((golpe, index) => (
                <button
                  key={index}
                  disabled={turno !== 'jogador'}
                  onClick={() => ataqueJogador(golpe)}
                  style={{
                    padding: '12px',
                    backgroundColor: index === 0 ? '#1976D2' : index === 1 ? '#F57C00' : '#D32F2F',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: 'bold',
                    cursor: turno === 'jogador' ? 'pointer' : 'not-allowed'
                  }}
                >
                  {golpe.name}
                </button>
              ))}
            </div>
          </div>

          <h1 style={{ fontSize: '40px', fontWeight: 'bold' }}>VS</h1>

          {/* Rival (Sprite de Frente) */}
          <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '12px', width: '40%', textAlign: 'center', border: turno === 'rival' ? '4px solid #f44336' : '1px solid #ccc' }}>
            <span style={{ fontSize: '14px', color: '#666' }}>Rival ({3 - idxRival} restantes)</span>
            <br />
            <img 
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pRival.pokemonId}.png`} 
              alt={pRival.name} 
              style={{ width: '150px' }} 
            />
            <h2 style={{ margin: '5px 0' }}>{pRival.name}</h2>

            <div style={{ backgroundColor: '#e0e0e0', borderRadius: '10px', height: '18px', width: '100%', margin: '10px 0 5px 0' }}>
              <div style={{ backgroundColor: pRival.hpAtual > pRival.hpMax / 4 ? '#4CAF50' : '#f44336', height: '18px', borderRadius: '10px', width: `${(pRival.hpAtual / pRival.hpMax) * 100}%`, transition: 'width 0.4s' }}></div>
            </div>
            <p style={{ margin: 0 }}><strong>HP:</strong> {pRival.hpAtual} / {pRival.hpMax}</p>
            <p><strong>Ataque Base:</strong> {pRival.attack}</p>
          </div>
        </div>

        {/* Log de Combate */}
        <div style={{ backgroundColor: '#1e1e1e', color: '#00FF66', padding: '15px', borderRadius: '8px', marginTop: '25px', height: '120px', overflowY: 'auto', fontFamily: 'monospace' }}>
          {log.map((linha, index) => (
            <p key={index} style={{ margin: '3px 0' }}>{'> ' + linha}</p>
          ))}
        </div>
      </div>
    );
  }

  // --- TELA DE SELEÇÃO ---
  return (
    <div style={{ backgroundColor: ARENAS[arena].bg, minHeight: '100vh', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h1 style={{ fontFamily: 'Arial', margin: 0 }}>Arena de Batalha Serverless</h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', backgroundColor: '#fff', padding: '10px 20px', borderRadius: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
          <label style={{ fontWeight: 'bold' }}>Nick:</label>
          <input
            type="text"
            placeholder="Seu Nickname..."
            maxLength={20}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '5px', border: '1px solid #ccc', outline: 'none' }}
          />
          <span style={{ fontWeight: 'bold', color: '#1976D2' }}>⭐ Pontos: {pontos}</span>
        </div>
      </div>

      <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '15px', borderRadius: '10px', margin: '20px 0' }}>
        <h3 style={{ margin: '0 0 10px 0' }}>1. Escolha o Local da Batalha:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {Object.keys(ARENAS).map((key) => {
            const bloqueada = pontos < ARENAS[key].reqPontos;
            return (
              <button
                key={key}
                disabled={bloqueada}
                onClick={() => handleTrocaArena(key)}
                style={{
                  padding: '10px 15px',
                  border: arena === key ? '3px solid #1976D2' : '1px solid #ccc',
                  backgroundColor: bloqueada ? '#e0e0e0' : arena === key ? '#E3F2FD' : '#fff',
                  color: bloqueada ? '#888' : '#000',
                  fontWeight: arena === key ? 'bold' : 'normal',
                  borderRadius: '6px',
                  cursor: bloqueada ? 'not-allowed' : 'pointer'
                }}
              >
                {bloqueada ? `🔒 ${ARENAS[key].name} (${ARENAS[key].reqPontos} pts)` : ARENAS[key].name}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ backgroundColor: 'rgba(255,255,255,0.9)', padding: '20px', borderRadius: '10px', marginBottom: '20px', textAlign: 'center' }}>
        <h2>2. Seu Time ({meuTime.length}/3)</h2>
        {meuTime.length === 0 && <p style={{ color: '#777' }}>Escolha Pokémons compatíveis com a arena atual abaixo.</p>}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', minHeight: '120px' }}>
          {meuTime.map((p) => (
            <div key={p.pokemonId} onClick={() => removerPokemon(p.pokemonId)} style={{ border: '2px solid #4CAF50', padding: '10px', borderRadius: '8px', cursor: 'pointer', backgroundColor: '#fff', width: '130px' }}>
              <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.pokemonId}.png`} alt={p.name} />
              <p style={{ margin: '5px 0' }}><strong>{p.name}</strong></p>
              <small>HP: {p.hp} | ATK: {p.attack}</small>
            </div>
          ))}
        </div>

        {meuTime.length === 3 && (
          <button onClick={iniciarBatalha} style={{ marginTop: '15px', padding: '12px 25px', fontSize: '18px', backgroundColor: '#2E7D32', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            ⚔️ Entrar na Batalha!
          </button>
        )}
      </div>

      <h3>3. Pokémons Permitidos nesta Arena ({pokemonsFiltrados.length}):</h3>
      {erroApi && <p style={{ color: '#c62828', fontWeight: 'bold' }}>{erroApi}</p>}
      {loading ? (
        <p>Carregando Pokémons...</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '15px' }}>
          {pokemonsFiltrados.map((pokemon) => {
            const selecionado = meuTime.some((p) => p.pokemonId === pokemon.pokemonId);
            return (
              <div
                key={pokemon.pokemonId}
                onClick={() => escolherPokemon(pokemon)}
                style={{
                  border: selecionado ? '2px solid #2196F3' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '10px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  opacity: selecionado ? 0.4 : 1
                }}
              >
                <img src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.pokemonId}.png`} alt={pokemon.name} />
                <h4 style={{ margin: '5px 0' }}>{pokemon.name}</h4>
                <span style={{ fontSize: '11px', color: '#666', textTransform: 'capitalize' }}>
                  {pokemon.type1} {pokemon.type2 ? `/ ${pokemon.type2}` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: '40px', backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
        <h2 style={{ margin: '0 0 15px 0' }}>🏆 Leaderboard Global</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#333', color: '#fff' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>#</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Treinador</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Vitórias</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Pontuação</th>
            </tr>
          </thead>
          <tbody>
            {ranking.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '15px', textAlign: 'center', color: '#777' }}>Nenhum registo no ranking até ao momento.</td>
              </tr>
            ) : (
              ranking.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{index + 1}º</td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{item.nickname}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>{item.vitorias || 0}</td>
                  <td style={{ padding: '10px', textAlign: 'right', color: '#1976D2', fontWeight: 'bold' }}>{item.pontuacao || 0} pts</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default App;