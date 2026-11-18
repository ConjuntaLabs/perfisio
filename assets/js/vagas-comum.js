/* PERFISIO — o vocabulário das vagas, num lugar só
   Os mesmos rótulos valem no quadro público, na página da vaga, na página do
   candidato e no painel da clínica: se o nome de um vínculo mudar, muda aqui. */
window.Vagas = (function () {
  const TIPOS = {
    clt: 'CLT', pj: 'PJ', freela: 'Freela', plantao: 'Plantão',
    estagio: 'Estágio', temporario: 'Temporária', voluntario: 'Voluntária',
  };
  const MODALIDADES = {
    presencial: 'Presencial', domiciliar: 'Domiciliar', hibrido: 'Híbrido', online: 'Teleatendimento',
  };
  const PERIODOS = { hora: 'por hora', plantao: 'por plantão', dia: 'por dia', mes: 'por mês', atendimento: 'por atendimento' };
  const STATUS = {
    nova: ['blue', 'nova'],
    triagem: ['amber', 'em triagem'],
    entrevista: ['primary', 'entrevista'],
    aprovada: ['green', 'aprovada'],
    recusada: ['gray', 'não seguiu'],
  };
  // cada tipo de vaga com a cara dele no quadro
  const ICONES = {
    clt: 'maleta', pj: 'ficha', freela: 'cronometro', plantao: 'hospital',
    estagio: 'ideia', temporario: 'repetir', voluntario: 'coracao',
  };

  const reais = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });

  /* o valor como a pessoa lê: uma faixa, um valor só, ou "a combinar" */
  function salario(v) {
    if (v.salario_combinar || (!v.salario_min && !v.salario_max)) {
      return { valor: 'A combinar', nota: 'valor na conversa' };
    }
    const min = v.salario_min, max = v.salario_max;
    const texto = min && max && min !== max ? `${reais(min)} a ${reais(max)}` : reais(min || max);
    return { valor: texto, nota: PERIODOS[v.salario_periodo] || '' };
  }

  function onde(v) {
    if (v.modalidade === 'online') return 'De onde você estiver';
    return [v.bairro, v.cidade].filter(Boolean).join(', ') || v.local || 'A combinar';
  }

  /* só o tempo, sem o verbo: quem chama diz "publicada", "enviada"... */
  function desdeQuando(iso) {
    const dias = Math.floor((Date.now() - new Date(iso).getTime()) / 86400e3);
    if (dias <= 0) return 'hoje';
    if (dias === 1) return 'ontem';
    if (dias < 30) return `há ${dias} dias`;
    const meses = Math.floor(dias / 30);
    return `há ${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  }

  const icone = v => ICONES[v.tipo] || 'maleta';

  return { TIPOS, MODALIDADES, PERIODOS, STATUS, ICONES, reais, salario, onde, desdeQuando, icone };
})();
