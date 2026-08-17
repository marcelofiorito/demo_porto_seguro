/**
 * Extensão para HANA Cloud — adiciona coluna Vector nativa (1536 dims)
 * Ativa com: cds watch --profile hybrid  ou  --profile production
 */
using { insurance } from '../schema';

extend insurance.InsurancePolicyChunk with {
    @cds.api.ignore
    embedding : Vector(1536);
}
