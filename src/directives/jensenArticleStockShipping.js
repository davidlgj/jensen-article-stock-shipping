angular.module('jensenArticleStockShipping').directive('jensenArticleStockShipping',
['twsApi.Jed', 'twsApi.Locale', '$q', 'twsArticleService.ArticleService', '$sce',
  function(jed, locale, $q, ArticleService, $sce) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        'articleUid': '=articleUid'
      },
      templateUrl: 'jensen-article-stock-shipping/templates/jensenArticleStockShipping.html',
      link: function(scope, element, attrs) { //jshint ignore:line
        jed(scope, 'tws-article-stock-shipping');
        scope.lang = locale.language();

        scope.$watch('articleUid', function(value) {
          if (!value) { return; }

          ArticleService.update(scope.articleUid).then(function(articleData) {
            const stock = articleData.article.stock;
            const deliveryInfo = articleData.article.deliveryInfo;

            scope.article     = articleData.article;
            scope.articleData = articleData;
            scope.schemaForm  = articleData.schemaForm;

            const apiStockMessage = stock.message[scope.lang] || '';
            const parsedStock = parseInt(apiStockMessage.replace(/[^\d]*/, ''), 10);
            if (!isNaN(parsedStock)) {
              // Hardcoded to 50 cm units
              scope.stockMessage = `I lager: ${parsedStock * 50} cm`;
            } else {
              scope.stockMessage =  stock.message ? $sce.trustAsHtml(apiStockMessage) : '';
            }


            scope.deliveryInfo =  deliveryInfo ? $sce.trustAsHtml(deliveryInfo[scope.lang] || '')
                                               : '';
          });
        });
      },
    };
  },
]);
