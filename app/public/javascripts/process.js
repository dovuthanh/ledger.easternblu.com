window.Process = {
    loading: (txt) => {
        $('#loading').show();
        $('.load').html(txt);
    },

    hideLoading :() => {
        $('#loading').hide();
    }
}