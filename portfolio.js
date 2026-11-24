const get = id => document.getElementById(id);
const img = get('slide-image');
let slide = 1;
function renderSlide() {
  img.src = 'assets/slide-' + String(slide).padStart(2, '0') + '.webp';
  img.alt = 'Слайд ' + slide + ' из 12';
  get('slide-count').value = slide + ' / 12';
  get('slide-prev').disabled = slide === 1;
  get('slide-next').disabled = slide === 12;
}
get('slide-prev').onclick = () => { slide--; renderSlide(); };
get('slide-next').onclick = () => { slide++; renderSlide(); };
get('slide-full').hidden = !document.fullscreenEnabled;
get('slide-full').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else get('slide-view').requestFullscreen();
};
renderSlide();

function choices(container, labels, onSelect) {
  let buttons = labels.map((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.onclick = () => select(index);
    container.append(button);
    return button;
  });
  function select(index) {
    buttons.forEach((button, j) => button.setAttribute('aria-pressed', String(index === j)));
    onSelect(index);
  }
  select(0);
}
const assembly = ['Опоры и временная оснастка','Установка поперечин','Продольные балки','Фиксация узлов','Собранный мост'];
choices(get('assembly-steps'), assembly.map((_,i) => String(i+1)), i => {
  const picture = get('assembly-frame');
  picture.src = 'assets/blueprint-assembly-0' + (i+1) + '.jpg';
  picture.alt = assembly[i];
  get('assembly-label').textContent = assembly[i];
});
for (const button of get('principle-steps').querySelectorAll('button')) {
  button.onclick = () => {
    const video = get('principle-view');
    const seek = () => { video.currentTime = Number(button.dataset.time); video.pause(); };
    if (video.readyState) seek();
    else { video.addEventListener('loadedmetadata', seek, {once:true}); video.load(); }
  };
}
const descriptions = {
  V3:'Цифровой прототип. Проверялось взаимное опирание.',
  V4:'Уточнены контакты. Выявлены перегрузка и трудный доступ к крепежу.',
  V5:'Переработаны опоры настила и ограждения. Увеличились масса и высота.',
  V6:'Уменьшена высота, добавлены Х-связи. В боковом сценарии выросла реакция удержания.'
};
fetch('revisions.json').then(response => {
  if (!response.ok) throw new Error('Revision data unavailable');
  return response.json();
}).then(rows => {
  rows.reverse();
  const names = ['Масса пролёта, кг','Высота настила, мм','Боковое перемещение, мм','Местная реакция удержания, кН'];
  choices(get('revisions'), rows.map(row => row[0]), i => {
    const row = rows[i];
    get('revision-title').textContent = row[0];
    get('revision-info').textContent = descriptions[row[0]];
    const list = get('revision-data');
    list.replaceChildren();
    [3,1,8,9].forEach((index,j) => {
      const term = document.createElement('dt');
      const value = document.createElement('dd');
      term.textContent = names[j];
      value.textContent = row[index] && Number.isFinite(Number(row[index])) ? Number(row[index]).toLocaleString('ru-RU',{maximumFractionDigits:index===8?1:2}) : '—';
      list.append(term,value);
    });
  });
}).catch(() => { get('revision-info').textContent = 'Сводные значения доступны в графике и файле CSV.'; });
