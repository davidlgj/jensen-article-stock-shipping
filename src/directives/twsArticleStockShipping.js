angular.module('twsArticleStockShipping').directive('twsArticleStockShipping',
['twsApi.Jed', 'twsApi.Locale', '$q', 'twsArticleService.ArticleService', '$sce',
  function(jed, locale, $q, ArticleService, $sce) {
    'use strict';
    return {
      restrict: 'EA',
      scope: {
        'articleUid': '=articleUid'
      },
      templateUrl: 'tws-article-stock-shipping/templates/twsArticleStockShipping.html',
      link: function(scope, element, attrs) { //jshint ignore:line
        jed(scope, 'tws-article-stock-shipping');
        scope.lang = locale.language();

        scope.$watch('articleUid', function(value) {
          if (!value) { return; }

          ArticleService.update(scope.articleUid).then(function(articleData) {
            const { lang } = scope;
            const stock = articleData.article.stock;
            const deliveryInfo = articleData.article.deliveryInfo;

            scope.article     = articleData.article;
            scope.articleData = articleData;
            scope.schemaForm  = articleData.schemaForm;

            scope.stockMessage =  stock.message ? $sce.trustAsHtml(stock.message[lang] || '') : '';
            scope.deliveryInfo =  deliveryInfo ? $sce.trustAsHtml(deliveryInfo[lang] || '') : '';
          });
        });
      },
    };
  },
]);
