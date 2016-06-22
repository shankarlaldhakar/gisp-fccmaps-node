(function(window, document, $) {
    'use strict';

    var MapGallery = {
        searchAPI: '/api.json',
        // q = query string
        // st = status
        // bo = bureau
        // id = map ID
        // o = order
        searchQuery: {
            q: '',
            st: 'active',
            o: 'date,desc',
            bo: ''
        },

        init: function() {
            // MapGallery.getData();
            MapGallery.getBureauFilters();
            MapGallery.initGrid();

            $('.search-filters')
                .on('click', '#btn-search', MapGallery.search)
                .on('change', '#sel-filter', MapGallery.filterByBureau)
                .on('click', '.map-status .btn', MapGallery.filterByStatus)
                .on('change', '#sel-sort', MapGallery.sortBy)
                .on('click', '#btn-resetFilters', MapGallery.clearFilters);

            $('#txt-search').on('keypress', function(e) {
                if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
                    MapGallery.search(e);
                    return false;
                } else {
                    return true;
                }
            });

            $(window).on('hashchange', MapGallery.onHashchange);

            // trigger event handler to init Isotope
            MapGallery.onHashchange();

            // add tabindex to enforce order
            $('#skip-link, header, .nav-secondary').find('a').add('.navbar-about').attr('tabindex', 10);
            $('.gallery__filterOpts').find('button, select, a').add('.gallery__numResults').attr('tabindex', 20);
        },

        initGrid: function() {
            var $grid = $('.map-cards')
                .isotope({
                    masonry: {
                        columnWidth: '.card',
                        gutter: 20
                    },
                    itemSelector: '.card',
                    transitionDuration: 0
                })
                .isotope('insert', window.allMaps)
                .on('click', '.btn-details', MapGallery.showCardDetails);

            $grid.imagesLoaded().progress(function() {
                $grid.isotope('layout');
            });
        },

        getData: function() {

            // clear search results
            $('#map-list-holder').html('');
            MapGallery.status = $('.map-status').find('.active').attr('data-filter');
            console.log(MapGallery.searchQuery);
            $.ajax({
                data: MapGallery.searchQuery,
                dataType: 'json',
                success: function(data) {
                    MapGallery.createMapCard(data);
                    MapGallery.updateResults(data.length);
                    MapGallery.showNumResults();
                },
                type: 'GET',
                url: MapGallery.searchAPI
            });
        },

        // populate bureau filter dropdown
        getBureauFilters: function() {
            var options = '';
            var bureaus = [];
            var bureauFilters = [];

            $.ajax({
                dataType: 'json',
                success: createBureauList,
                type: 'GET',
                url: MapGallery.searchAPI
            });

            // create list of unique bureau ID's
            function uniqueBureau(arr) {
                var uniqueBureaus = [];
                var dupes = {};

                $.each(arr, function(i, el) {
                    if (!dupes[el.id]) {
                        dupes[el.id] = true;
                        uniqueBureaus.push(el);
                    }
                });

                // sort by alphabetical order
                function compare(a, b) {
                    if (a.id < b.id)
                        return -1;
                    if (a.id > b.id)
                        return 1;
                    return 0;
                }

                uniqueBureaus.sort(compare);

                return uniqueBureaus;
            }

            function createBureauList(data) {

                for (var i = 0; i < data.length; i++) {
                    bureaus.push(data[i].meta.bureau);
                }

                bureauFilters = uniqueBureau(bureaus);

                for (var k = 0; k < bureauFilters.length; k++) {
                    options += '<option value="' + bureauFilters[k].id + '">' + bureauFilters[k].name + '</option>';
                }

                $('#sel-filter')
                    .find('option:not(:first-child)').remove()
                    .end()
                    .find('option:first-child').after(options);
            }

        },

        search: function(e) {
            // MapGallery.searchQuery.q = $('#txt-search').val();

            MapGallery.searchQuery = {
                q: $('#txt-search').val(),
                st: 'all',
                o: 'date,desc',
                bo: ''
            };

            e.preventDefault();
            MapGallery.toggleAlert('hide');
            MapGallery.locationHash();
        },

        createMapCard: function(mapData) {
            var date = '';
            var maps = {};
            var source = $('#card-template').html();

            Handlebars.registerHelper('isIframe', function(map_type, options) {
                if (map_type === 'layers') {
                    return options.fn(this);
                }
                return options.inverse(this);
            });

            Handlebars.registerHelper('formatDate', function(dateReviewed, options) {
                return dateReviewed.split(' ')[0];
            });

            var template = Handlebars.compile(source);

            maps.cards = mapData;
            var cardList = template(maps);

            // update isotope with new cards
            $('.map-cards').isotope('insert', $(cardList));
            $('.map-cards').isotope('layout');
        },

        updateResults: function(numResults) {
            var idx = 100;

            if (numResults === 0) {
                MapGallery.toggleAlert('show');
            }

            $('.gallery__numResults')
                .html('Showing: ' + numResults + ' maps');

            $('.card').removeAttr('tabindex');

            // add tabindex to enforce tab order
            $('.map-cards').find('li').each(function(index, element) {
                idx = idx + 10 + index;

                $(element)
                    .attr('tabindex', idx)
                    .add()
                    .find('a, button').attr('tabindex', idx)
                    .end()
                    .find('.link-viewMore').attr('tabindex', idx + 1);
            });
        },

        toggleAlert: function(isShown) {
            $('.alert-noResults').toggleClass('hide', (isShown !== 'show'));
        },

        showCardDetails: function(e) {
            var thisBtn = $(this),
                thisCard = thisBtn.closest('.card'),
                thisCardBody = thisCard.find('.card__body');

            e.preventDefault();

            if (thisCardBody.is(':visible')) {
                thisBtn
                    .html('<span class="icon icon-caret-right"></span>View details')
                    .attr('aria-expanded', false);

                thisCardBody.slideUp(function() {
                    thisCardBody.attr('aria-hidden', true);
                    thisCardBody.css('z-index', '');
                    $('.map-cards').isotope('layout');
                });
            } else {
                thisBtn
                    .html('<span class="icon icon-caret-down"></span>Hide details')
                    .attr('aria-expanded', true);

                thisCardBody.slideDown(function() {
                    thisCardBody.attr('aria-hidden', false);
                    thisCardBody.css('z-index', 2);
                    $('.map-cards').isotope('layout');
                });
            }
        },

        showNumResults: function() {
            $('.gallery__numResults').focus();
        },

        sortBy: function() {
            var selectedVal = $(this).find(':selected').attr('data-value');

            MapGallery.searchQuery.o = selectedVal;
            MapGallery.locationHash();
        },

        filterByBureau: function() {
            var selectedVal = this.value;

            MapGallery.toggleAlert('hide');
            MapGallery.searchQuery.bo = selectedVal === 'all' ? '' : selectedVal;
            MapGallery.locationHash();
        },

        filterByStatus: function() {
            $('.map-status').find('.active').removeClass('active');
            $(this).addClass('active');

            MapGallery.searchQuery.st = $(this).attr('data-filter');
            MapGallery.toggleAlert('hide');
            MapGallery.locationHash();
        },

        clearFilters: function(e) {
            e.preventDefault();

            MapGallery.toggleAlert('hide');

            MapGallery.searchQuery = {
                q: '',
                st: 'active',
                o: 'date,desc',
                bo: ''
            };

            $('#txt-search').val('');
            $('#sel-filter').find(':first-child').prop('selected', true);
            $('#sel-sort').find(':first-child').prop('selected', true);

            $('.map-status')
                .find('.active')
                .removeClass('active')
                .end()
                .find('.btn').eq(1).addClass('active');

            MapGallery.locationHash();
        },

        locationHash: function() {
            location.hash = $.param(MapGallery.searchQuery);
        },

        getHashFilter: function() {
            var hash = decodeURIComponent(location.hash);
            var queryHash = hash.match(/q=([^&]+)/i);
            var statusHash = hash.match(/st=([^&]+)/i);
            var bureauHash = hash.match(/bo=([^&]+)/i);
            var sortHash = hash.match(/o=([^&]+)/i);

            MapGallery.searchQuery.q = queryHash === null ? MapGallery.searchQuery.q : decodeURIComponent(queryHash[1].replace(/\+/g, '%20'));
            MapGallery.searchQuery.st = statusHash === null ? MapGallery.searchQuery.st : decodeURIComponent(statusHash[1]);
            MapGallery.searchQuery.bo = bureauHash === null ? MapGallery.searchQuery.bo : decodeURIComponent(bureauHash[1]);
            MapGallery.searchQuery.o = sortHash === null ? MapGallery.searchQuery.o : decodeURIComponent(sortHash[1]);
        },

        onHashchange: function() {
            MapGallery.getHashFilter();
            MapGallery.getData();
console.log('onHashchange');
            $(document).ajaxStop(function() {
            	var boVal = MapGallery.searchQuery.bo === '' ? 'all' : MapGallery.searchQuery.bo;

                var searchVal = MapGallery.searchQuery.q;
                var statusBtn = '[data-filter="' + MapGallery.searchQuery.st + '"]';
                var bureauVal = 'option[value="' + boVal + '"]';
                var sortVal = 'option[data-value="' + MapGallery.searchQuery.o + '"]';

                $('.map-status')
                    .find('.active')
                    .removeClass('active');

                $('#txt-search').val(searchVal);
                $(statusBtn).addClass('active');
                $('#sel-filter').find(bureauVal).prop('selected', true);
                $('#sel-sort').find(sortVal).prop('selected', true);
            });
        }
    };

    MapGallery.init();

}(window, document, jQuery));