define([
    'jquery',
    'backbone',
    'arches',
    'models/concept',
    'models/value',
    'views/rdm/value-editor'
], function($, Backbone, arches, ConceptModel, ValueModel, ValueEditor) {
    return Backbone.View.extend({
        events: {
            'click': 'click',
            'click a.edit-value': 'editValueClicked',
            'click .confirm-delete-yes': 'deleteConfirmed'
        },

        initialize: function() {
            var self = this;

            self.model.on('change', function() {
                self.render();
            });

            self.render();
        },

        render: function() {
            var self = this,
                conceptid = this.model.get('id');
            if (conceptid) {
                self.$el.find('.concept-report-loading').removeClass('hidden');
                self.$el.find('.concept-report-content').addClass('hidden');
                $.ajax({
                    url: '../Concepts/' + conceptid + '?f=html',
                    success: function(response) {
                        self.$el.find('.concept-report-loading').addClass('hidden');
                        self.$el.html(response);
                        // ADD CHILD CONCEPT EDITOR 
                        self.$el.find('#conceptmodal').validate({
                            ignore: null, // required so that the select2 dropdowns will be visible to the validate plugin
                            rules: {
                                // element_name: value
                                label: "required",
                                language_dd: "required"
                            },
                            submitHandler: function(form) {
                                var childConcept = new ConceptModel({
                                        label: $(form).find("[name=label]").val(),
                                        note: $(form).find("[name=note]").val(),
                                        language: $(form).find("[name=language_dd]").select2('val'),
                                        parentconceptid: concept.get('id')
                                    });
                                childConcept.save(function() {
                                    self.$el.find('#conceptmodal').modal('hide');
                                    self.trigger('conceptAdded', childConcept);
                                });
                            }
                        });
                    }
                });
            }
        },

        click: function(e) {
            var self = this,
                data = $(e.target).data();
            if (data.action === 'delete' || data.action === 'delete_concept') {
                self.$el.find('.confirm-delete-modal .modal-title').text($(e.target).attr('title'));
                self.$el.find('.confirm-delete-modal .modal-body').text(data.message);
                self.$el.find('.confirm-delete-modal').modal('show');
                self.$el.find('.confirm-delete-yes').data('id', data.id);
                self.$el.find('.confirm-delete-yes').data('action', data.action);
            }

            if (data.action === 'viewconcept') {
                this.model.set({
                    id: data.conceptid
                });
            }
        },

        editValueClicked: function(e) {
            var self = this,
                data = $.extend({
                    conceptid: this.model.get('id')
                }, $(e.target).data()),
                model = new ValueModel(data),
                editor = new ValueEditor({
                    el: $(data.target)[0],
                    model: model
                });

            editor.on('submit', function() {
                model.save(function() {
                    self.render();
                    self.trigger('valueSaved', model);
                });
            });
        },

        deleteConfirmed: function(e) {
            var self = this,
                data = $(e.target).data(),
                model;

            self.$el.find('.confirm-delete-modal').modal('hide');
            if (data.action === 'delete') {
                model = new ValueModel(data);
                model.delete(function() {
                    self.render();
                    self.trigger('valueDeleted', model);
                });
            }
            if (data.action === 'delete_concept') {
                model = new ConceptModel(data);
                model.delete(function(data) {
                    self.trigger('conceptDeleted', model);
                });
            }
        }
    });
});