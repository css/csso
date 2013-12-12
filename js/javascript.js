var csssrc = document.getElementById('csssrc'),
    cssdst = document.getElementById('cssdst'),
    slength = document.getElementById('slength'),
    dlength = document.getElementById('dlength'),
    result = document.getElementById('result');

function updateStat() {
    slength.innerHTML = csssrc.value.length;
    dlength.innerHTML = cssdst.value.length;
    result.innerHTML = (100 * cssdst.value.length / csssrc.value.length).toFixed(2);
}

document.getElementById('minimize').onclick = function() {
    var compressor = new CSSOCompressor(),
        translator = new CSSOTranslator();
    cssdst.value = translator.translate(cleanInfo(compressor.compress(srcToCSSP(csssrc.value, 'stylesheet', true))));
    updateStat();
};
