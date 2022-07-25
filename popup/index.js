Log('init');

sendMsgToPage({ type: 'PopupRended' }, res => {
  // Log('PopupRended响应: ', res);
  const keys = Object.keys(res);
  keys.forEach(k => {
    const el = document.querySelector(`input#${k}`);
    if (!el) return;
    const attr = el.type === 'checkbox' ? 'checked' : 'value';
    el[attr] = res[k];
  });
});

const inputEles = Array.from(document.querySelectorAll('input'));
const btnSubmit = document.querySelector('#submit');
btnSubmit.onclick = async () => {
  const form = inputEles.reduce((acc, ele) => {
    const type = ele.id;
    const val = ele.type === 'checkbox' ? ele.checked : ele.value.trim();
    acc[type] = val;
    return acc;
  }, {});
  
  sendMsgToPage({ type: 'UpdateSearch', data: form });
};
