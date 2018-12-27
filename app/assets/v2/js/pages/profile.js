$(document).ready(function() {
  $('[data-toggle=popover]').popover({
    html: true,
    trigger: 'focus',
    template: '<div class="popover wallet-popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>',
    content: function() {
      var content = $(this).attr('data-popover-content');

      return $(content).children('.popover-body').html();
    },
    title: function() {
      var title = $(this).attr('data-popover-content');

      return $(title).children('.popover-heading').html();
    }
  });

  if (!document.hasPreferredPayoutAddress) {
    $('[data-toggle=popover]').popover('show');
  }

  $('body').on('submit', '#form-wallets', function(e) {
    e.preventDefault();

    var data = $('#form-wallets').serializeArray();

    data.push({'page': 2});

    var postWallets = fetchData(
      e.currentTarget.action,
      e.currentTarget.method,
      data
    );

    $.when(postWallets).then(function(response) {
      var walletAddress = response.wallets[0];
      var newAddress = new truncate(walletAddress);

      $('#preferred-address').text(newAddress.elem);
      $('#preferred-address').prop('title', walletAddress);
      $('#kudos-section').html(response.kudos_html);
    });
  });

  $('#kudos-section').on('click keypress', '.flip-card', e => {
    if ($(e.target).is('a')) {
      e.stopPropagation();
      return;
    }
    $(e.currentTarget).toggleClass('turn');
  });

  setupTabs('#activity-tabs');

  const tabSection = document.querySelector('#activity-tabs-sections');
  const updateViewBtn = document.querySelector('#update-view-btn');
  let fetchInProgress = false;

  function updateView(ignoreScrollOffset) {
    window.setTimeout(updateView, 300);

    if (fetchInProgress) {
      return;
    }

    const activityContainer = document.querySelector('.tab-section.active .activities');
    const activityCount = parseInt(activityContainer.getAttribute('count')) || 0;
    const loadingImg = document.querySelector('.loading_img');

    if (activityContainer.children.length < activityCount) {
      updateViewBtn.style['visibility'] = 'visible';
    } else {
      updateViewBtn.style['visibility'] = 'hidden';
      return;
    }

    if (ignoreScrollOffset || window.scrollY >= tabSection.scrollHeight) {
      const activityName = activityContainer.id;
      let page = parseInt(activityContainer.getAttribute('page')) || 1;

      fetchInProgress = true;
      loadingImg.className = loadingImg.className.replace('hidden', 'visible');

      fetch(document.location.href + '?p=' + (++page) + '&a=' + activityName).then(
        function(response) {
          if (response.status === 200) {
            response.text().then(
              function(html) {
                const results = document.createElement('div');

                activityContainer.setAttribute('page', page);
                results.insertAdjacentHTML('afterBegin', html);

                const childs = results.children;

                while (childs.length) {
                  activityContainer.append(childs[0]);
                }

                fetchInProgress = false;
                loadingImg.className = loadingImg.className.replace('visible', 'hidden');
              }
            );
            return;
          }

          fetchInProgress = false;
          hideBusyOverlay();
        }
      ).catch(
        function() {
          fetchInProgress = false;
          loadingImg.className = loadingImg.className.replace('visible', 'hidden');
        }
      );
    }
  }

  if (updateViewBtn) {
    updateViewBtn.addEventListener('click',
      function() {
        updateView(true);
      },
      false
    );

    updateView();
  }
});

(function($) {
  $(document).on('click', '.load-more', function() {
    var address = $('#preferred-address').prop('title');
    var link = $(this);
    var page = link.data('page');
    var request = link.data('request');
    var handle = link.data('handle');

    if (!handle) {
      return;
    }

    $.ajax({
      type: 'POST',
      url: '/kudos/lazy_load/',
      data: {
        'page': page,
        'request': request,
        'address': address,
        'handle': handle,
        'csrfmiddlewaretoken': '{{csrf_token}}' // from index.html
      },
      success: function(data) {
        // if there are still more pages to load,
        // add 1 to the "Load More Posts" link's page data attribute
        // else hide the link
        if (data.has_next) {
          link.data('page', page + 1);
        } else {
          link.hide();
        }
        // append html to the posts div
        var elem = '#' + request;

        $(elem + ' div').first().append(data.kudos_html);
      },
      error: function(xhr, status, error) {
        // shit happens friends!
      }
    });
  });
}(jQuery));