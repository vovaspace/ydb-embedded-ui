import React from 'react';

import {CircleXmarkFill, TriangleExclamationFill} from '@gravity-ui/icons';
import {Dialog, Icon} from '@gravity-ui/uikit';

import type {IResponseError} from '../../types/api/error';
import {cn} from '../../utils/cn';

import {criticalActionDialogKeyset} from './i18n';

import './CriticalActionDialog.scss';

const b = cn('ydb-critical-dialog');

const parseError = (error: IResponseError) => {
    if (error.status === 403) {
        return criticalActionDialogKeyset('no-rights-error');
    }
    if (error.statusText) {
        return error.statusText;
    }

    return criticalActionDialogKeyset('default-error');
};

interface CriticalActionDialogProps<T> {
    visible: boolean;
    text: string;
    onClose: VoidFunction;
    onConfirm: () => Promise<T>;
    onConfirmActionSuccess: VoidFunction;
    onConfirmActionError: VoidFunction;
}

export function CriticalActionDialog<T>({
    visible,
    text,
    onClose,
    onConfirm,
    onConfirmActionSuccess,
    onConfirmActionError,
}: CriticalActionDialogProps<T>) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<IResponseError>();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        return onConfirm()
            .then(() => {
                onConfirmActionSuccess();
                onClose();
            })
            .catch((err) => {
                onConfirmActionError();
                setError(err);
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const renderDialogContent = () => {
        if (error) {
            return (
                <React.Fragment>
                    <Dialog.Body className={b('body')}>
                        <span className={b('error-icon')}>
                            <CircleXmarkFill width="24" height="22" />
                        </span>
                        {parseError(error)}
                    </Dialog.Body>

                    <Dialog.Footer
                        loading={false}
                        preset="default"
                        textButtonCancel={criticalActionDialogKeyset('button-close')}
                        onClickButtonCancel={onClose}
                    />
                </React.Fragment>
            );
        }

        return (
            <form onSubmit={onSubmit}>
                <Dialog.Body className={b('body')}>
                    <span className={b('warning-icon')}>
                        <Icon data={TriangleExclamationFill} size={24} />
                    </span>
                    {text}
                </Dialog.Body>

                <Dialog.Footer
                    loading={isLoading}
                    preset="default"
                    textButtonApply={criticalActionDialogKeyset('button-confirm')}
                    textButtonCancel={criticalActionDialogKeyset('button-cancel')}
                    propsButtonApply={{type: 'submit'}}
                    onClickButtonCancel={onClose}
                    onClickButtonApply={() => {}}
                />
            </form>
        );
    };

    return (
        <Dialog
            open={visible}
            hasCloseButton={false}
            className={b()}
            size="s"
            onClose={onClose}
            onTransitionExited={() => setError(undefined)}
        >
            {renderDialogContent()}
        </Dialog>
    );
}
